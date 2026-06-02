const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer");
const sharp = require("sharp");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  },
});

// Helpers
function cleanup(...filePaths) {
  filePaths.forEach((fp) => {
    if (fp && fs.existsSync(fp)) {
      try { fs.unlinkSync(fp); } catch (e) {}
    }
  });
}

async function uploadToStorage(buffer, userId, filename) {
  const filePath = `uploads/${userId}/${Date.now()}_${filename}`;
  const { error } = await supabase.storage
    .from("fileflip-files")
    .upload(filePath, buffer, { upsert: true });
  if (error) console.warn("Storage upload warning:", error.message);
  return filePath;
}

async function logConversion(userId, originalName, convertedName, type, sizeKb, status) {
  const { error } = await supabase.from("conversions").insert({
    user_id: userId,
    original_filename: originalName,
    converted_filename: convertedName,
    conversion_type: type,
    file_size_kb: sizeKb,
    status,
  });
  if (error) console.warn("DB log warning:", error.message);
}

// ── GET /api/convert (health check for routes) ────────────────────────────
router.get("/", (req, res) => {
  res.json({
    routes: [
      "POST /api/convert/docx-to-pdf",
      "POST /api/convert/compress-image",
      "POST /api/convert/text-to-pdf",
    ],
  });
});

// ── POST /api/convert/docx-to-pdf ─────────────────────────────────────────
router.post("/docx-to-pdf", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;
  let tempDocxPath = null;

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(req.file.mimetype)) {
      cleanup(tempInputPath);
      return res.status(400).json({ error: "File must be a DOCX or DOC" });
    }

    const originalName = req.file.originalname;
    const baseName = path.basename(originalName, path.extname(originalName));
    const convertedName = `${baseName}.pdf`;
    const sizeKb = Math.round(req.file.size / 1024);

    tempDocxPath = path.join(os.tmpdir(), `${uuidv4()}.docx`);
    fs.copyFileSync(tempInputPath, tempDocxPath);

    const { value: html } = await mammoth.convertToHtml({ path: tempDocxPath });

    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              padding: 72px;
            }
            h1 { font-size: 18pt; margin-bottom: 12pt; margin-top: 16pt; }
            h2 { font-size: 16pt; margin-bottom: 10pt; margin-top: 14pt; }
            h3 { font-size: 14pt; margin-bottom: 8pt; margin-top: 12pt; }
            p { margin-bottom: 8pt; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
            td, th { border: 1px solid #ccc; padding: 6pt 8pt; }
            th { background: #f0f0f0; font-weight: bold; }
            ul, ol { margin-left: 24pt; margin-bottom: 8pt; }
            li { margin-bottom: 4pt; }
            strong, b { font-weight: bold; }
            em, i { font-style: italic; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "72px", right: "72px", bottom: "72px", left: "72px" },
      printBackground: true,
    });
    await browser.close();

    const docxBuffer = fs.readFileSync(tempDocxPath);
    uploadToStorage(docxBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(Buffer.from(pdfBuffer), req.user.id, convertedName).catch(console.warn);

    await logConversion(req.user.id, originalName, convertedName, "docx-to-pdf", sizeKb, "success");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (err) {
    console.error("DOCX to PDF error:", err);
    if (req.file) {
      await logConversion(req.user?.id, req.file.originalname, "", "docx-to-pdf",
        Math.round((req.file.size || 0) / 1024), "failed").catch(() => {});
    }
    res.status(500).json({ error: "Conversion failed", message: err.message });
  } finally {
    cleanup(tempInputPath, tempDocxPath);
  }
});

// ── POST /api/convert/compress-image ──────────────────────────────────────
router.post("/compress-image", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(req.file.mimetype)) {
      cleanup(tempInputPath);
      return res.status(400).json({ error: "File must be JPG, PNG or WEBP" });
    }

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext);
    const convertedName = `${baseName}_compressed${ext}`;
    const sizeKb = Math.round(req.file.size / 1024);
    const quality = parseInt(req.body.quality) || 75;

    let compressedBuffer;
    const imageProcessor = sharp(tempInputPath);

    if (ext === ".jpg" || ext === ".jpeg" || req.file.mimetype === "image/jpeg") {
      compressedBuffer = await imageProcessor
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    } else if (ext === ".png" || req.file.mimetype === "image/png") {
      compressedBuffer = await imageProcessor
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else {
      compressedBuffer = await imageProcessor
        .webp({ quality })
        .toBuffer();
    }

    const compressedSizeKb = Math.round(compressedBuffer.length / 1024);
    const savedPercent = Math.max(0, Math.round(((sizeKb - compressedSizeKb) / sizeKb) * 100));

    const originalBuffer = fs.readFileSync(tempInputPath);
    uploadToStorage(originalBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(compressedBuffer, req.user.id, convertedName).catch(console.warn);

    await logConversion(req.user.id, originalName, convertedName, "compress-image", sizeKb, "success");

    res.setHeader("X-Original-Size", String(sizeKb));
    res.setHeader("X-Compressed-Size", String(compressedSizeKb));
    res.setHeader("X-Saved-Percent", String(savedPercent));
    res.setHeader("Access-Control-Expose-Headers", "X-Original-Size, X-Compressed-Size, X-Saved-Percent");

    const mimeMap = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
    res.setHeader("Content-Type", mimeMap[ext] || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(compressedBuffer);

  } catch (err) {
    console.error("Image compress error:", err);
    if (req.file) {
      await logConversion(req.user?.id, req.file.originalname, "", "compress-image",
        Math.round((req.file.size || 0) / 1024), "failed").catch(() => {});
    }
    res.status(500).json({ error: "Compression failed", message: err.message });
  } finally {
    cleanup(tempInputPath);
  }
});

// ── POST /api/convert/text-to-pdf ──────────────────────────────────────────
router.post("/text-to-pdf", authMiddleware, async (req, res) => {
  try {
    const { text, filename, fontSize, fontStyle } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text provided" });
    }

    const baseName = (filename || "document").replace(/[^a-z0-9_\-\s]/gi, "_").trim();
    const convertedName = `${baseName}.pdf`;
    const sizeKb = Math.max(1, Math.round(Buffer.byteLength(text, "utf8") / 1024));

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(
      fontStyle === "courier" ? StandardFonts.Courier :
      fontStyle === "helvetica" ? StandardFonts.Helvetica :
      StandardFonts.TimesRoman
    );

    const size = parseInt(fontSize) || 12;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 72;
    const lineHeight = size * 1.5;
    const maxWidth = pageWidth - margin * 2;

    function wrapText(inputText) {
      const paragraphs = inputText.split("\n");
      const lines = [];
      for (const para of paragraphs) {
        if (para.trim() === "") { lines.push(""); continue; }
        const words = para.split(" ");
        let currentLine = "";
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, size);
          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
      }
      return lines;
    }

    const allLines = wrapText(text);
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of allLines) {
      if (y - lineHeight < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      if (line.trim() !== "") {
        currentPage.drawText(line, {
          x: margin,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        });
      }
      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    uploadToStorage(pdfBuffer, req.user.id, convertedName).catch(console.warn);
    await logConversion(req.user.id, `${baseName}.txt`, convertedName, "text-to-pdf", sizeKb, "success");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Text to PDF error:", err);
    await logConversion(req.user?.id, "text_input.txt", "", "text-to-pdf", 0, "failed").catch(() => {});
    res.status(500).json({ error: "Conversion failed", message: err.message });
  }
});

module.exports = router;
