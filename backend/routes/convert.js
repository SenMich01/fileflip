const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");
const mammoth = require("mammoth");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lazy load puppeteer and sharp to avoid startup crashes
let puppeteerInstance = null;
let sharpLib = null;

async function getSharp() {
  if (!sharpLib) {
    sharpLib = require("sharp");
  }
  return sharpLib;
}

async function getBrowser() {
  if (!puppeteerInstance) {
    const puppeteer = require("puppeteer");
    puppeteerInstance = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
    });
  }
  return puppeteerInstance;
}

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
  try {
    const filePath = `uploads/${userId}/${Date.now()}_${filename}`;
    await supabase.storage
      .from("fileflip-files")
      .upload(filePath, buffer, { upsert: true });
  } catch (e) {
    console.warn("Storage upload warning:", e.message);
  }
}

async function logConversion(userId, originalName, convertedName, type, sizeKb, status) {
  try {
    await supabase.from("conversions").insert({
      user_id: userId,
      original_filename: originalName,
      converted_filename: convertedName,
      conversion_type: type,
      file_size_kb: sizeKb,
      status,
    });
  } catch (e) {
    console.warn("DB log warning:", e.message);
  }
}

// ── GET /api/convert ───────────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.json({
    status: "ok",
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
  let browser = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

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

    const styledHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; padding: 72px; }
      h1 { font-size: 18pt; margin: 16pt 0 12pt; }
      h2 { font-size: 16pt; margin: 14pt 0 10pt; }
      h3 { font-size: 14pt; margin: 12pt 0 8pt; }
      p { margin-bottom: 8pt; }
      ul, ol { margin-left: 24pt; margin-bottom: 8pt; }
      li { margin-bottom: 4pt; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
      td, th { border: 1px solid #ccc; padding: 6pt 8pt; }
      th { background: #f0f0f0; font-weight: bold; }
    </style>
  </head>
  <body>${html}</body>
</html>`;

    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "72px", right: "72px", bottom: "72px", left: "72px" },
      printBackground: true,
    });
    await page.close();

    const docxBuffer = fs.readFileSync(tempDocxPath);
    uploadToStorage(docxBuffer, req.user.id, originalName);
    uploadToStorage(Buffer.from(pdfBuffer), req.user.id, convertedName);
    await logConversion(req.user.id, originalName, convertedName, "docx-to-pdf", sizeKb, "success");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (err) {
    console.error("DOCX to PDF error:", err.message);
    await logConversion(req.user?.id, req.file?.originalname || "unknown", "", "docx-to-pdf", 0, "failed");
    res.status(500).json({ error: "Conversion failed", message: err.message });
  } finally {
    cleanup(tempInputPath, tempDocxPath);
  }
});

// ── POST /api/convert/compress-image ──────────────────────────────────────
router.post("/compress-image", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(req.file.mimetype)) {
      cleanup(tempInputPath);
      return res.status(400).json({ error: "File must be JPG, PNG or WEBP" });
    }

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const baseName = path.basename(originalName, ext);
    const convertedName = `${baseName}_compressed${ext}`;
    const sizeKb = Math.round(req.file.size / 1024);
    const quality = Math.min(100, Math.max(10, parseInt(req.body.quality) || 75));

    console.log(`Compressing image: ${originalName}, quality: ${quality}, type: ${req.file.mimetype}`);

    const sharp = await getSharp();
    let compressedBuffer;

    const mime = req.file.mimetype;

    if (mime === "image/png") {
      compressedBuffer = await sharp(tempInputPath)
        .png({ compressionLevel: 9, quality })
        .toBuffer();
    } else if (mime === "image/webp") {
      compressedBuffer = await sharp(tempInputPath)
        .webp({ quality })
        .toBuffer();
    } else {
      // jpeg/jpg — no mozjpeg flag
      compressedBuffer = await sharp(tempInputPath)
        .jpeg({ quality })
        .toBuffer();
    }

    const compressedSizeKb = Math.round(compressedBuffer.length / 1024);
    const savedPercent = Math.max(0, Math.round(((sizeKb - compressedSizeKb) / sizeKb) * 100));

    console.log(`Compressed: ${sizeKb}KB → ${compressedSizeKb}KB (${savedPercent}% saved)`);

    const originalBuffer = fs.readFileSync(tempInputPath);
    uploadToStorage(originalBuffer, req.user.id, originalName);
    uploadToStorage(compressedBuffer, req.user.id, convertedName);
    await logConversion(req.user.id, originalName, convertedName, "compress-image", sizeKb, "success");

    res.setHeader("X-Original-Size", String(sizeKb));
    res.setHeader("X-Compressed-Size", String(compressedSizeKb));
    res.setHeader("X-Saved-Percent", String(savedPercent));
    res.setHeader("Access-Control-Expose-Headers", "X-Original-Size, X-Compressed-Size, X-Saved-Percent");

    const mimeMap = {
      "image/jpeg": "image/jpeg",
      "image/jpg": "image/jpeg",
      "image/png": "image/png",
      "image/webp": "image/webp",
    };
    res.setHeader("Content-Type", mimeMap[mime] || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(compressedBuffer);

  } catch (err) {
    console.error("Image compress error:", err.message);
    await logConversion(req.user?.id, req.file?.originalname || "unknown", "", "compress-image", 0, "failed");
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

    console.log(`Text to PDF: ${text.length} chars, font: ${fontStyle}, size: ${fontSize}`);

    const baseName = (filename || "document")
      .replace(/[^a-z0-9_\-\s]/gi, "_")
      .trim()
      .substring(0, 50);
    const convertedName = `${baseName}.pdf`;
    const sizeKb = Math.max(1, Math.round(Buffer.byteLength(text, "utf8") / 1024));

    const pdfDoc = await PDFDocument.create();

    let selectedFont;
    try {
      if (fontStyle === "courier") {
        selectedFont = await pdfDoc.embedFont(StandardFonts.Courier);
      } else if (fontStyle === "helvetica") {
        selectedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      } else {
        selectedFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      }
    } catch (fontErr) {
      console.warn("Font embed error, falling back:", fontErr.message);
      selectedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const size = Math.min(36, Math.max(8, parseInt(fontSize) || 12));
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 60;
    const lineHeight = size * 1.6;
    const maxWidth = pageWidth - margin * 2;

    // Word wrap
    function wrapText(inputText) {
      const paragraphs = inputText.split("\n");
      const lines = [];
      for (const para of paragraphs) {
        if (para.trim() === "") {
          lines.push("");
          continue;
        }
        const words = para.split(" ");
        let currentLine = "";
        for (const word of words) {
          if (!word) continue;
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          let testWidth = 0;
          try {
            testWidth = selectedFont.widthOfTextAtSize(testLine, size);
          } catch (e) {
            testWidth = testLine.length * size * 0.5;
          }
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
        try {
          currentPage.drawText(line, {
            x: margin,
            y,
            size,
            font: selectedFont,
            color: rgb(0, 0, 0),
          });
        } catch (drawErr) {
          console.warn("Draw text error (skipping line):", drawErr.message);
        }
      }
      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    console.log(`Text to PDF complete: ${pdfBuffer.length} bytes, ${pdfDoc.getPageCount()} pages`);

    uploadToStorage(pdfBuffer, req.user.id, convertedName);
    await logConversion(req.user.id, `${baseName}.txt`, convertedName, "text-to-pdf", sizeKb, "success");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Text to PDF error:", err.message, err.stack);
    await logConversion(req.user?.id, "text_input.txt", "", "text-to-pdf", 0, "failed");
    res.status(500).json({ error: "Conversion failed", message: err.message });
  }
});

module.exports = router;
