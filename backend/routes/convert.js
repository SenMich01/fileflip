const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const LibreOfficeConvert = require("libreoffice-convert");
const { promisify } = require("util");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");

const libreConvert = promisify(LibreOfficeConvert.convert);
const router = express.Router();

// Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer - store in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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

// Helper: upload file buffer to Supabase Storage
async function uploadToStorage(buffer, userId, filename) {
  const filePath = `uploads/${userId}/${Date.now()}_${filename}`;
  const { error } = await supabase.storage
    .from("fileflip-files")
    .upload(filePath, buffer, { upsert: true });
  if (error) console.warn("Storage upload warning:", error.message);
  return filePath;
}

// Helper: log conversion to DB
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

// Helper: cleanup temp files
function cleanup(...filePaths) {
  filePaths.forEach((fp) => {
    if (fp && fs.existsSync(fp)) {
      try { fs.unlinkSync(fp); } catch (e) { /* ignore */ }
    }
  });
}

// ─── POST /api/convert/pdf-to-docx ───────────────────────────────────────────
router.post("/pdf-to-docx", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;
  let tempOutputPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanup(tempInputPath);
      return res.status(400).json({ error: "File must be a PDF" });
    }

    const originalName = req.file.originalname;
    const baseName = path.basename(originalName, ".pdf");
    const convertedName = `${baseName}.docx`;
    const sizeKb = Math.round(req.file.size / 1024);

    // Parse PDF text
    const pdfBuffer = fs.readFileSync(tempInputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData.text || "";

    // Split into paragraphs and build DOCX
    const lines = rawText.split("\n").filter((l) => l.trim().length > 0);

    const docChildren = lines.map((line, i) => {
      const trimmed = line.trim();
      // Heuristic: short ALL-CAPS or very short lines may be headings
      const isHeading =
        i === 0 ||
        (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && trimmed.length > 3);

      if (isHeading && i === 0) {
        return new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: trimmed, bold: true })],
        });
      }
      return new Paragraph({
        children: [new TextRun({ text: trimmed })],
        spacing: { after: 120 },
      });
    });

    if (docChildren.length === 0) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: "No text content could be extracted from this PDF." })],
        })
      );
    }

    const doc = new Document({
      creator: "FileFlip",
      title: baseName,
      sections: [{ properties: {}, children: docChildren }],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    // Save temp output
    tempOutputPath = path.join(os.tmpdir(), `${uuidv4()}.docx`);
    fs.writeFileSync(tempOutputPath, docxBuffer);

    // Upload originals to Supabase Storage (non-blocking)
    uploadToStorage(pdfBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(docxBuffer, req.user.id, convertedName).catch(console.warn);

    // Log to DB
    await logConversion(req.user.id, originalName, convertedName, "pdf-to-docx", sizeKb, "success");

    // Send file
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(docxBuffer);

  } catch (err) {
    console.error("PDF→DOCX error:", err);
    if (req.file) {
      await logConversion(
        req.user?.id, req.file.originalname, "", "pdf-to-docx",
        Math.round((req.file.size || 0) / 1024), "failed"
      ).catch(() => {});
    }
    res.status(500).json({ error: "Conversion failed", message: err.message });
  } finally {
    cleanup(tempInputPath, tempOutputPath);
  }
});

// ─── POST /api/convert/docx-to-pdf ───────────────────────────────────────────
router.post("/docx-to-pdf", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;
  let tempDocxPath = null;
  let tempOutputPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const validDocxTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validDocxTypes.includes(req.file.mimetype)) {
      cleanup(tempInputPath);
      return res.status(400).json({ error: "File must be a DOCX or DOC" });
    }

    const originalName = req.file.originalname;
    const baseName = path.basename(originalName, path.extname(originalName));
    const convertedName = `${baseName}.pdf`;
    const sizeKb = Math.round(req.file.size / 1024);

    // LibreOffice needs the file to have .docx extension
    tempDocxPath = path.join(os.tmpdir(), `${uuidv4()}.docx`);
    fs.copyFileSync(tempInputPath, tempDocxPath);

    const docxBuffer = fs.readFileSync(tempDocxPath);

    // Convert using LibreOffice
    const pdfBuffer = await libreConvert(docxBuffer, ".pdf", undefined);

    // Save temp output
    tempOutputPath = path.join(os.tmpdir(), `${uuidv4()}.pdf`);
    fs.writeFileSync(tempOutputPath, pdfBuffer);

    // Upload to Supabase Storage (non-blocking)
    uploadToStorage(docxBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(pdfBuffer, req.user.id, convertedName).catch(console.warn);

    // Log to DB
    await logConversion(req.user.id, originalName, convertedName, "docx-to-pdf", sizeKb, "success");

    // Send file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("DOCX→PDF error:", err);
    if (req.file) {
      await logConversion(
        req.user?.id, req.file.originalname, "", "docx-to-pdf",
        Math.round((req.file.size || 0) / 1024), "failed"
      ).catch(() => {});
    }
    res.status(500).json({ error: "Conversion failed", message: err.message });
  } finally {
    cleanup(tempInputPath, tempDocxPath, tempOutputPath);
  }
});

module.exports = router;
