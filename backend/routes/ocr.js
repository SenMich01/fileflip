const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");
const { createWorker } = require("tesseract.js");
const sharp = require("sharp");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer config - images only
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG and WEBP images are allowed."));
    }
  },
});

// Helper: cleanup temp files
function cleanup(...filePaths) {
  filePaths.forEach((fp) => {
    if (fp && fs.existsSync(fp)) {
      try { fs.unlinkSync(fp); } catch (e) {}
    }
  });
}

// Helper: log to Supabase
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

// Helper: upload to Supabase Storage
async function uploadToStorage(buffer, userId, filename) {
  const filePath = `uploads/${userId}/${Date.now()}_${filename}`;
  const { error } = await supabase.storage
    .from("fileflip-files")
    .upload(filePath, buffer, { upsert: true });
  if (error) console.warn("Storage upload warning:", error.message);
  return filePath;
}

// ── POST /api/ocr/image-to-text ──────────────────────────────────────────────
router.post("/image-to-text", authMiddleware, upload.single("file"), async (req, res) => {
  const tempInputPath = req.file?.path;
  let tempOutputPath = null;
  let worker = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = req.file.originalname;
    const baseName = path.basename(originalName, path.extname(originalName));
    const convertedName = `${baseName}_extracted.docx`;
    const sizeKb = Math.round(req.file.size / 1024);

    // Preprocess image with sharp
    const preprocessedImageBuffer = await sharp(tempInputPath)
      .grayscale()
      .normalize()
      .resize({ width: 1500 })
      .png()
      .toBuffer();

    // Run Tesseract OCR
    worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(preprocessedImageBuffer);
    await worker.terminate();
    worker = null;

    if (!text || text.trim().length === 0) {
      return res.status(422).json({
        error: "No text found",
        message: "Could not extract any text from this image. Make sure the image is clear and contains readable text.",
      });
    }

    // Build DOCX from extracted text
    const lines = text.split("\n").filter((l) => l.trim().length > 0);

    const docChildren = lines.map((line, i) => {
      const trimmed = line.trim();
      const isHeading = i === 0 && trimmed.length < 80;

      if (isHeading) {
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

    const doc = new Document({
      creator: "FileFlip",
      title: `Extracted text from ${originalName}`,
      sections: [{ properties: {}, children: docChildren }],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    // Save temp output
    tempOutputPath = path.join(os.tmpdir(), `${uuidv4()}.docx`);
    fs.writeFileSync(tempOutputPath, docxBuffer);

    // Upload to Supabase Storage (non-blocking)
    const imageBuffer = fs.readFileSync(tempInputPath);
    uploadToStorage(imageBuffer, req.user.id, originalName).catch(console.warn);
    uploadToStorage(docxBuffer, req.user.id, convertedName).catch(console.warn);

    // Log to DB
    await logConversion(
      req.user.id,
      originalName,
      convertedName,
      "image-to-text",
      sizeKb,
      "success"
    );

    // Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${convertedName}"`);
    res.send(docxBuffer);

  } catch (err) {
    console.error("OCR error:", err);
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }
    if (req.file) {
      await logConversion(
        req.user?.id,
        req.file.originalname,
        "",
        "image-to-text",
        Math.round((req.file.size || 0) / 1024),
        "failed"
      ).catch(() => {});
    }
    res.status(500).json({ error: "OCR failed", message: err.message });
  } finally {
    cleanup(tempInputPath, tempOutputPath);
  }
});

module.exports = router;
