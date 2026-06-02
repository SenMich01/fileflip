const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer config
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOCX files are allowed."));
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

// ── POST /api/convert/pdf-to-docx ─────────────────────────────────────────
router.post("/pdf-to-docx", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (req.file.mimetype !== "application/pdf") {
      cleanup(tempInputPath);
      return res.status(400).json({ error: "File must be a PDF" });
    }

    const originalName = req.file.originalname;
    const baseName = path.basename(originalName, ".pdf");
    const convertedName = `${baseName}.docx`;
    const sizeKb = Math.round(req.file.size / 1024);

    // Parse PDF
    const pdfBuffer = fs.readFileSync(tempInputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData.text || "";

    // Build DOCX
    const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
    const docChildren = lines.length > 0
      ? lines.map((line, i) => {
          const trimmed = line.trim();
          if (i === 0) {
            return new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: trimmed, bold: true })],
            });
          }
          return new Paragraph({
            children: [new TextRun({ text: trimmed })],
            spacing: { after: 120 },
          });
        })
      : [new Paragraph({ children: [new TextRun({ text: "No text could be extracted from this PDF." })] })];

    const doc = new Document({
      creator: "FileFlip",
      title: baseName,
      sections: [{ properties: {}, children: docChildren }],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    // Upload to storage (non-blocking)
    uploadToStorage(pdfBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(docxBuffer, req.user.id, convertedName).catch(console.warn);

    // Log to DB
    await logConversion(req.user.id, originalName, convertedName, "pdf-to-docx", sizeKb, "success");

    // Send file
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(docxBuffer);

  } catch (err) {
    console.error("PDF to DOCX error:", err);
    if (req.file) {
      await logConversion(req.user?.id, req.file.originalname, "", "pdf-to-docx",
        Math.round((req.file.size || 0) / 1024), "failed").catch(() => {});
    }
    res.status(500).json({ error: "Conversion failed", message: err.message });
  } finally {
    cleanup(tempInputPath);
  }
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

    // Copy to .docx path so mammoth can read it
    tempDocxPath = path.join(os.tmpdir(), `${uuidv4()}.docx`);
    fs.copyFileSync(tempInputPath, tempDocxPath);

    // Step 1: Convert DOCX to HTML using mammoth
    const { value: html } = await mammoth.convertToHtml({ path: tempDocxPath });

    // Step 2: Wrap HTML in a styled page
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
              max-width: 100%;
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
            u { text-decoration: underline; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;

    // Step 3: Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
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

    // Read original for storage upload
    const docxBuffer = fs.readFileSync(tempDocxPath);

    // Upload to storage (non-blocking)
    uploadToStorage(docxBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(Buffer.from(pdfBuffer), req.user.id, convertedName).catch(console.warn);

    // Log to DB
    await logConversion(req.user.id, originalName, convertedName, "docx-to-pdf", sizeKb, "success");

    // Send file
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

module.exports = router;
