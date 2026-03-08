const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import conversion services and queue manager
const { pdfToWord, epubToPdf, imageToPdf } = require('../services/conversionService.cjs');
const { addToQueue } = require('../utils/queueManager.cjs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: '/tmp',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Helper function to send files
function sendFile(res, outputPath, filename) {
  const stats = fs.statSync(outputPath);
  if (stats.size === 0) {
    return res.status(500).json({ error: 'Conversion produced empty file' });
  }
  res.download(outputPath, filename, (err) => {
    if (err) console.error('Download error:', err);
    try { fs.unlinkSync(outputPath); } catch (e) {}
  });
}

// Check and deduct credits middleware
async function checkCredits(req, res, next) {
  const userId = req.headers['x-user-id'];
  // If guest user skip Supabase credit check
  // Credits are handled on frontend via localStorage for guests
  if (!userId) return next();
  
  // If supabase is not initialized, skip Supabase credit check
  if (!req.app.locals.supabase) return next();
  
  // Check Supabase credits for logged in users
  const { data, error } = await req.app.locals.supabase
    .from('profiles')
    .select('credits, email')
    .eq('id', userId)
    .single();
  
  if (error || !data) return res.status(400).json({ error: 'Could not verify credits' });
  
  // Give unlimited conversions to magboyinu14@gmail.com
  if (data.email === 'magboyinu14@gmail.com') {
    req.userCredits = 'Unlimited';
    return next();
  }
  
  if (data.credits <= 0) return res.status(403).json({ error: 'No credits remaining. Please upgrade.' });
  req.userCredits = data.credits;
  next();
}

// Deduct 1 credit after successful conversion
async function deductCredit(userId, supabase) {
  if (!userId || !supabase) return;
  const { data } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
  if (data) {
    await supabase
      .from('profiles')
      .update({ credits: data.credits - 1 })
      .eq('id', userId);
  }
}

// PDF to Word conversion route
router.post('/pdf-to-word', upload.single('file'), checkCredits, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const outputPath = await addToQueue(() => pdfToWord(req.file.path));
    await deductCredit(req.headers['x-user-id'], req.app.locals.supabase);
    sendFile(res, outputPath, 'converted.docx');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
  }
});

// EPUB to PDF conversion route
router.post('/epub-to-pdf', upload.single('file'), checkCredits, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const outputPath = await addToQueue(() => epubToPdf(req.file.path));
    await deductCredit(req.headers['x-user-id'], req.app.locals.supabase);
    sendFile(res, outputPath, 'converted.pdf');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
  }
});

// Image to PDF conversion route
router.post('/image-to-pdf', upload.single('file'), checkCredits, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const outputPath = await addToQueue(() => imageToPdf(req.file.path));
    await deductCredit(req.headers['x-user-id'], req.app.locals.supabase);
    sendFile(res, outputPath, 'converted.pdf');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
  }
});

module.exports = router;