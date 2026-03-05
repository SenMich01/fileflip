import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { Document, Packer } from 'docx';
import { Paragraph, TextRun } from 'docx';
import EPub from 'epub';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import fsExtra from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directories
const TEMP_DIR = '/tmp/fileflip';
const UPLOAD_DIR = path.join(TEMP_DIR, 'uploads');
const CONVERTED_DIR = path.join(TEMP_DIR, 'converted');

// Ensure temp directories exist
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(CONVERTED_DIR, { recursive: true });
} catch (error) {
  console.log('Temp directories already exist or created successfully');
}

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.use(cors({
  origin: 'https://fileflip.onrender.com'
}));
app.use(express.json());

// Configure multer with disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'application/epub+zip': ['epub'],
      'application/octet-stream': ['epub'] // Fallback for EPUB
    };
    
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'epub'];
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Only API routes here
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Payment verification endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, email, planType } = req.body;
    
    if (!reference || !email || !planType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify payment with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const { data } = response.data;

    if (data.status === 'success' && data.amount >= (planType === 'Pro' ? 900 : 50)) {
      // Payment successful, update user in Supabase
      const userUpdate = await axios.post(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles`, {
        id: data.customer.email, // This would need to be the user ID, not email
        plan_type: planType,
        credits: planType === 'Pay Per Use' ? 10 : 0, // Add 10 credits for pay per use
        pro_expires_at: planType === 'Pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
      }, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        planType,
        credits: planType === 'Pay Per Use' ? 10 : 0
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Check user credits endpoint
app.get('/api/user-credits', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const response = await axios.get(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      }
    });

    const user = response.data;
    
    // Get user profile
    const profileResponse = await axios.get(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profile = profileResponse.data[0];
    
    res.json({
      credits: profile?.credits || 0,
      planType: profile?.plan_type || 'Free',
      proExpiresAt: profile?.pro_expires_at
    });
  } catch (error) {
    console.error('Error checking user credits:', error);
    res.status(500).json({ error: 'Failed to check user credits' });
  }
});

// Deduct credits endpoint
app.post('/api/deduct-credits', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const response = await axios.get(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      }
    });

    const user = response.data;
    
    // Get current profile
    const profileResponse = await axios.get(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profile = profileResponse.data[0];
    
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Check if user has enough credits or is Pro
    const isPro = profile.plan_type === 'Pro' && new Date(profile.pro_expires_at) > new Date();
    const hasCredits = (profile.credits || 0) > 0;

    if (!isPro && !hasCredits) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    // Deduct credit if not Pro
    if (!isPro) {
      const newCredits = (profile.credits || 0) - 1;
      
      await axios.patch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
        credits: newCredits
      }, {
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
    }

    res.json({ success: true, remainingCredits: isPro ? 'Unlimited' : (profile.credits || 0) - 1 });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

// File conversion endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  let convertedFilePath = null;
  
  try {
    const { targetFormat } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!targetFormat) {
      return res.status(400).json({ error: 'Target format not specified' });
    }

    // Validate file size
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return res.status(400).json({ error: 'File too large. Maximum file size is 50MB' });
    }

    // Validate file extension
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'epub'];
    const inputExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!inputExtension || !allowedExtensions.includes(inputExtension)) {
      return res.status(400).json({ error: 'Invalid file format. Supported formats: PDF, JPG, PNG, WebP, EPUB' });
    }

    // Validate target format
    const supportedConversions = {
      'pdf': ['jpg', 'png', 'docx'],
      'jpg': ['pdf'],
      'jpeg': ['pdf'],
      'png': ['pdf'],
      'webp': ['pdf'],
      'epub': ['pdf']
    };

    const validTargets = supportedConversions[inputExtension] || [];
    if (!validTargets.includes(targetExtension)) {
      return res.status(400).json({ 
        error: `Invalid target format. Supported conversions for ${inputExtension.toUpperCase()}: ${validTargets.join(', ')}` 
      });
    }

    // Check if user is authenticated (for credits)
    const authHeader = req.headers.authorization;
    let user = null;
    let profile = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Verify token with Supabase
        const response = await axios.get(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.VITE_SUPABASE_ANON_KEY
          }
        });

        user = response.data;
        
        // Get user profile
        const profileResponse = await axios.get(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        profile = profileResponse.data[0];
      } catch (error) {
        // User not authenticated, will use guest credits
      }
    }

    // Check credits for authenticated users
    if (user && profile) {
      const isPro = profile.plan_type === 'Pro' && new Date(profile.pro_expires_at) > new Date();
      const hasCredits = (profile.credits || 0) > 0;

      if (!isPro && !hasCredits) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }

      // Deduct credit if not Pro
      if (!isPro) {
        const newCredits = (profile.credits || 0) - 1;
        
        await axios.patch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
          credits: newCredits
        }, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
      }
    } else {
      // Check guest credits
      const guestCredits = parseInt(req.headers['x-guest-credits'] || '0');
      if (guestCredits <= 0) {
        return res.status(403).json({ 
          error: 'You have no credits left. Sign up for free to get more credits!',
          showSignup: true
        });
      }
    }

    // Set file paths
    uploadedFilePath = file.path;
    const baseName = path.basename(file.originalname, path.extname(file.originalname));
    const timestamp = Date.now();
    const targetExtension = targetFormat.toLowerCase();

    // Perform conversion based on file type and target format
    let mimeType;
    let outputFileName;

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    // PDF to Image conversion
    if (fileExtension === 'pdf' && (targetExtension === 'jpg' || targetExtension === 'png')) {
      outputFileName = `${baseName}_${timestamp}.${targetExtension}`;
      convertedFilePath = path.join(CONVERTED_DIR, outputFileName);
      await convertPdfToImage(uploadedFilePath, convertedFilePath, targetExtension);
      mimeType = targetExtension === 'jpg' ? 'image/jpeg' : 'image/png';
    }
    // PDF to Word conversion
    else if (fileExtension === 'pdf' && targetExtension === 'docx') {
      outputFileName = `${baseName}_${timestamp}.docx`;
      convertedFilePath = path.join(CONVERTED_DIR, outputFileName);
      await convertPdfToWord(uploadedFilePath, convertedFilePath);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    // Image to PDF conversion
    else if ((fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'webp') && targetExtension === 'pdf') {
      outputFileName = `${baseName}_${timestamp}.pdf`;
      convertedFilePath = path.join(CONVERTED_DIR, outputFileName);
      await convertImageToPdf(uploadedFilePath, convertedFilePath);
      mimeType = 'application/pdf';
    }
    // EPUB to PDF conversion
    else if (fileExtension === 'epub' && targetExtension === 'pdf') {
      outputFileName = `${baseName}_${timestamp}.pdf`;
      convertedFilePath = path.join(CONVERTED_DIR, outputFileName);
      await convertEpubToPdf(uploadedFilePath, convertedFilePath);
      mimeType = 'application/pdf';
    }
    else {
      return res.status(400).json({ error: 'Unsupported conversion' });
    }

    // Verify converted file exists and has content
    if (!fs.existsSync(convertedFilePath)) {
      throw new Error('Conversion failed: output file not created');
    }

    const fileStats = fs.statSync(convertedFilePath);
    if (fileStats.size === 0) {
      throw new Error('Conversion failed: output file is empty');
    }

    // Download the converted file
    res.download(convertedFilePath, outputFileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    // Clean up uploaded file
    try {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded file:', cleanupError);
    }
  }
});

// Helper function to convert PDF to Word (.docx)
async function convertPdfToWord(inputPath, outputPath) {
  console.log('Starting PDF to DOCX conversion...');
  console.log(`Input file size: ${fs.statSync(inputPath).size} bytes`);
  
  const startTime = Date.now();
  
  try {
    // Read PDF file
    const pdfBuffer = fs.readFileSync(inputPath);
    
    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const textContent = pdfData.text || '';
    
    console.log(`Extracted text length: ${textContent.length} characters`);
    
    // Split text into paragraphs
    const paragraphs = textContent.split('\n\n').filter(p => p.trim().length > 0);
    
    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs.map(paragraph => {
          return new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                font: 'Arial',
                size: 24 // 12pt
              })
            ],
            spacing: {
              after: 120 // 6pt spacing after paragraph
            }
          });
        })
      }]
    });

    // Generate DOCX buffer
    const docxBinary = await Packer.toBuffer(doc);
    
    // Write to file
    fs.writeFileSync(outputPath, docxBinary);
    
    const endTime = Date.now();
    const fileSize = fs.statSync(outputPath).size;
    
    console.log(`DOCX conversion completed in ${endTime - startTime}ms`);
    console.log(`Output file size: ${fileSize} bytes`);
    
    if (fileSize === 0) {
      throw new Error('Generated DOCX file is empty');
    }
    
    return outputPath;
  } catch (error) {
    console.error('PDF to DOCX conversion error:', error);
    throw new Error(`PDF to Word conversion failed: ${error.message}`);
  }
}

// Helper function to convert EPUB to PDF
async function convertEpubToPdf(inputPath, outputPath) {
  console.log('Starting EPUB to PDF conversion...');
  console.log(`Input file size: ${fs.statSync(inputPath).size} bytes`);
  
  const startTime = Date.now();
  
  try {
    // Create PDF document
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // Create write stream
    const writeStream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(writeStream);
    
    // Set up PDF styling
    pdfDoc.font('Helvetica');
    pdfDoc.fontSize(12);
    
    // Add title
    pdfDoc.moveDown();
    pdfDoc.text('Converted from EPUB', { align: 'center' });
    pdfDoc.moveDown(2);
    
    // Parse EPUB
    const epub = new EPub(inputPath);
    
    return new Promise((resolve, reject) => {
      epub.on('end', () => {
        pdfDoc.end();
        
        writeStream.on('finish', () => {
          const endTime = Date.now();
          const fileSize = fs.statSync(outputPath).size;
          
          console.log(`EPUB to PDF conversion completed in ${endTime - startTime}ms`);
          console.log(`Output file size: ${fileSize} bytes`);
          
          if (fileSize === 0) {
            reject(new Error('Generated PDF file is empty'));
          } else {
            resolve(outputPath);
          }
        });
        
        writeStream.on('error', reject);
      });
      
      epub.on('error', reject);
      
      epub.on('toc', (toc) => {
        // Add table of contents
        pdfDoc.text('Table of Contents', { underline: true });
        pdfDoc.moveDown();
        
        toc.forEach((chapter, index) => {
          pdfDoc.text(`${index + 1}. ${chapter.title}`, {
            link: chapter.href,
            continued: true
          });
          pdfDoc.text(' ...');
          pdfDoc.moveDown(0.5);
        });
        
        pdfDoc.moveDown(2);
      });
      
      epub.on('chapter', (chapter) => {
        // Add chapter title
        pdfDoc.text(chapter.title, { underline: true });
        pdfDoc.moveDown();
        
        // Add chapter content (remove HTML tags)
        const cleanText = chapter.text.replace(/<[^>]*>/g, '');
        pdfDoc.text(cleanText, {
          lineGap: 2,
          indent: 20
        });
        
        pdfDoc.moveDown(2);
      });
      
      epub.parse();
    });
  } catch (error) {
    console.error('EPUB to PDF conversion error:', error);
    throw new Error(`EPUB to PDF conversion failed: ${error.message}`);
  }
}

// Helper function to convert image to PDF
async function convertImageToPdf(inputPath, outputPath) {
  console.log('Starting Image to PDF conversion...');
  console.log(`Input file size: ${fs.statSync(inputPath).size} bytes`);
  
  const startTime = Date.now();
  
  try {
    // Process image with sharp
    const imageBuffer = fs.readFileSync(inputPath);
    
    // Convert image to RGB format and ensure proper quality
    const processedImage = await sharp(imageBuffer)
      .ensureAlpha()
      .toColorspace('rgb16')
      .jpeg({ quality: 90 })
      .toBuffer();

    // Create PDF with pdf-lib
    const pdfDoc = await PDFLibDocument.create();
    
    // Embed the image based on its format
    let image;
    try {
      image = await pdfDoc.embedJpg(processedImage);
    } catch (jpgError) {
      try {
        image = await pdfDoc.embedPng(processedImage);
      } catch (pngError) {
        // Fallback: try to embed as is
        image = await pdfDoc.embedJpg(imageBuffer);
      }
    }

    // Get image dimensions and calculate page size
    const { width, height } = image.scale(1.0);
    
    // Create page with proper dimensions (A4 aspect ratio or image aspect ratio)
    const pageWidth = Math.min(612, width); // Max width for standard PDF
    const pageHeight = Math.min(792, height); // Max height for standard PDF
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Calculate proper positioning to center the image
    const margin = 20;
    const imageWidth = Math.min(width, pageWidth - (margin * 2));
    const imageHeight = (imageWidth / width) * height;
    
    page.drawImage(image, {
      x: margin,
      y: pageHeight - imageHeight - margin,
      width: imageWidth,
      height: imageHeight,
    });

    const pdfBuffer = await pdfDoc.save();
    
    // Write to file
    fs.writeFileSync(outputPath, pdfBuffer);
    
    const endTime = Date.now();
    const fileSize = fs.statSync(outputPath).size;
    
    console.log(`Image to PDF conversion completed in ${endTime - startTime}ms`);
    console.log(`Output file size: ${fileSize} bytes`);
    
    if (fileSize === 0) {
      throw new Error('Generated PDF file is empty');
    }
    
    return outputPath;
  } catch (error) {
    console.error('Image to PDF conversion error:', error);
    throw new Error(`Image to PDF conversion failed: ${error.message}`);
  }
}

// Helper function to convert PDF to image
async function convertPdfToImage(inputPath, outputPath, format) {
  console.log(`Starting PDF to ${format.toUpperCase()} conversion...`);
  console.log(`Input file size: ${fs.statSync(inputPath).size} bytes`);
  
  const startTime = Date.now();
  
  try {
    // Read PDF file
    const pdfBuffer = fs.readFileSync(inputPath);
    
    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const textContent = pdfData.text || '';
    
    console.log(`Extracted text length: ${textContent.length} characters`);
    
    // Create image with the text content
    const text = textContent || 'PDF content extraction failed';
    
    // Create a simple image with the text using sharp
    const imageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([{
      input: Buffer.from(`<svg width="800" height="600">
        <rect width="800" height="600" fill="white"/>
        <text x="20" y="40" font-family="Arial" font-size="14" fill="black">${text}</text>
      </svg>`),
      top: 0,
      left: 0
    }])
    .toFormat(format)
    .toBuffer();

    // Write to file
    fs.writeFileSync(outputPath, imageBuffer);
    
    const endTime = Date.now();
    const fileSize = fs.statSync(outputPath).size;
    
    console.log(`PDF to ${format.toUpperCase()} conversion completed in ${endTime - startTime}ms`);
    console.log(`Output file size: ${fileSize} bytes`);
    
    if (fileSize === 0) {
      throw new Error(`Generated ${format.toUpperCase()} file is empty`);
    }
    
    return outputPath;
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
}

// Add all other API routes here

// SPA fallback route - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Don't serve index.html for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('Static asset not found');
  }
  
  // Serve the SPA for all other routes
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback to serving from public directory
    const publicIndexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(publicIndexPath)) {
      res.sendFile(publicIndexPath);
    } else {
      res.status(404).send('Page not found');
    }
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});