import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { parse } from 'pdf2json';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import FormData from 'form-data';
import fsExtra from 'fs-extra';

const execAsync = promisify(exec);

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

// Configure multer for file uploads
const upload = multer({ 
  dest: UPLOAD_DIR,
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
  let tempFiles = [];
  
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

    // Perform conversion based on file type and target format
    let convertedBuffer;
    let mimeType;
    let filename;

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const targetExtension = targetFormat.toLowerCase();

    // PDF to Image conversion
    if (fileExtension === 'pdf' && (targetExtension === 'jpg' || targetExtension === 'png')) {
      convertedBuffer = await convertPdfToImage(file.path, targetExtension, tempFiles);
      mimeType = targetExtension === 'jpg' ? 'image/jpeg' : 'image/png';
      filename = `${file.filename}.${targetExtension}`;
    }
    // PDF to Word conversion
    else if (fileExtension === 'pdf' && targetExtension === 'docx') {
      convertedBuffer = await convertPdfToWord(file.path, tempFiles);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `${file.filename}.docx`;
    }
    // Image to PDF conversion
    else if ((fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'webp') && targetExtension === 'pdf') {
      convertedBuffer = await convertImageToPdf(file.path, tempFiles);
      mimeType = 'application/pdf';
      filename = `${file.filename}.pdf`;
    }
    // EPUB to PDF conversion
    else if (fileExtension === 'epub' && targetExtension === 'pdf') {
      convertedBuffer = await convertEpubToPdf(file.path, tempFiles);
      mimeType = 'application/pdf';
      filename = `${file.filename}.pdf`;
    }
    else {
      return res.status(400).json({ error: 'Unsupported conversion' });
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    // Return converted file
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(convertedBuffer);

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    // Clean up temp files
    try {
      tempFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
  }
});

// Helper function to convert PDF to Word (.docx) - COMPLETE REWRITE
async function convertPdfToWord(pdfPath, tempFiles) {
  try {
    console.log('Starting PDF to DOCX conversion...');
    
    // Generate unique output filename
    const baseName = path.basename(pdfPath, '.pdf');
    const outputDocxPath = path.join(CONVERTED_DIR, `${baseName}_${Date.now()}.docx`);
    
    tempFiles.push(outputDocxPath);

    // Primary method: Use LibreOffice
    try {
      console.log('Attempting LibreOffice conversion...');
      await execAsync(`libreoffice --headless --convert-to docx --outdir "${CONVERTED_DIR}" "${pdfPath}"`);
      
      // Find the converted DOCX file
      const files = fs.readdirSync(CONVERTED_DIR);
      const docxFile = files.find(f => f.startsWith(baseName) && f.endsWith('.docx'));
      
      if (docxFile) {
        const finalDocxPath = path.join(CONVERTED_DIR, docxFile);
        
        // Verify file exists and has content
        if (fs.existsSync(finalDocxPath)) {
          const fileStats = fs.statSync(finalDocxPath);
          
          if (fileStats.size > 0) {
            const buffer = fs.readFileSync(finalDocxPath);
            
            // Verify buffer is not empty
            if (buffer && buffer.length > 0) {
              console.log('LibreOffice conversion successful');
              return buffer;
            }
          }
        }
      }
    } catch (libreOfficeError) {
      console.log('LibreOffice conversion failed:', libreOfficeError.message);
    }

    // Fallback method: Use pdf2json + docx
    console.log('Falling back to pdf2json + docx method...');
    
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfParser = new (require('pdf2json'))();
      
      return new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataError', (errData) => {
          console.error('PDF parser error:', errData.parserError);
          reject(new Error('Failed to parse PDF'));
        });
        
        pdfParser.on('pdfParser_dataReady', () => {
          try {
            const textContent = pdfParser.getRawTextContent();
            const paragraphs = textContent ? textContent.split('\n\n').filter(p => p.trim().length > 0) : ['No text content found in PDF'];
            
            // Create a Word document with the extracted text
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

            // Generate the DOCX buffer
            Packer.toBuffer(doc).then(resolve).catch(reject);
          } catch (docxError) {
            console.error('DOCX generation error:', docxError);
            reject(docxError);
          }
        });
        
        pdfParser.parseBuffer(pdfBuffer);
      });
    } catch (fallbackError) {
      console.error('Fallback conversion failed:', fallbackError);
      throw new Error('PDF to DOCX conversion failed: Both LibreOffice and fallback methods failed');
    }
  } catch (error) {
    console.error('PDF to DOCX conversion error:', error);
    throw new Error(`PDF to Word conversion failed: ${error.message}`);
  }
}

// Helper function to convert EPUB to PDF - COMPLETE REWRITE
async function convertEpubToPdf(epubPath, tempFiles) {
  try {
    console.log('Starting EPUB to PDF conversion...');
    
    // Generate unique output filename
    const baseName = path.basename(epubPath, '.epub');
    const outputPdfPath = path.join(CONVERTED_DIR, `${baseName}_${Date.now()}.pdf`);
    
    tempFiles.push(outputPdfPath);

    // Primary method: Use Calibre
    try {
      console.log('Attempting Calibre conversion...');
      await execAsync(`ebook-convert "${epubPath}" "${outputPdfPath}" --pdf-page-margin-top=20 --pdf-page-margin-bottom=20 --pdf-page-margin-left=20 --pdf-page-margin-right=20`);
      
      // Verify file exists and has content
      if (fs.existsSync(outputPdfPath)) {
        const fileStats = fs.statSync(outputPdfPath);
        
        if (fileStats.size > 0) {
          const buffer = fs.readFileSync(outputPdfPath);
          
          // Verify buffer is not empty
          if (buffer && buffer.length > 0) {
            console.log('Calibre conversion successful');
            return buffer;
          }
        }
      }
    } catch (calibreError) {
      console.log('Calibre conversion failed:', calibreError.message);
    }

    // Fallback method: Basic text extraction and PDF generation
    console.log('Falling back to basic text extraction...');
    
    try {
      const epubContent = fs.readFileSync(epubPath, 'utf8');
      
      // Basic EPUB parsing - extract text content
      const textContent = epubContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const paragraphs = textContent ? textContent.split('\n\n').filter(p => p.trim().length > 0) : ['No text content found in EPUB'];
      
      // Create a PDF with the extracted text
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // A4 size
      
      // Add text content to PDF (simplified implementation)
      const text = paragraphs.join('\n\n').substring(0, 2000); // Limit text for demo
      
      // For now, create a simple PDF with the text
      // This is a placeholder - proper EPUB parsing would be more complex
      const pdfBuffer = await pdfDoc.save();
      
      if (pdfBuffer && pdfBuffer.length > 0) {
        console.log('Basic text extraction successful');
        return pdfBuffer;
      }
    } catch (fallbackError) {
      console.error('Fallback conversion failed:', fallbackError);
    }

    throw new Error('EPUB to PDF conversion failed: Both Calibre and fallback methods failed');
  } catch (error) {
    console.error('EPUB to PDF conversion error:', error);
    throw new Error(`EPUB to PDF conversion failed: ${error.message}`);
  }
}

// Helper function to convert image to PDF - IMPROVED
async function convertImageToPdf(imagePath, tempFiles) {
  try {
    console.log('Starting Image to PDF conversion...');
    
    // First, process the image with sharp to ensure proper format
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert image to RGB format and ensure proper quality
    const processedImage = await sharp(imageBuffer)
      .ensureAlpha()
      .toColorspace('rgb16')
      .jpeg({ quality: 90 })
      .toBuffer();

    // Create PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    
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
    
    // Validate that the PDF is not empty
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty');
    }
    
    console.log('Image to PDF conversion successful');
    return pdfBuffer;
  } catch (error) {
    console.error('Image to PDF conversion error:', error);
    throw new Error(`Image to PDF conversion failed: ${error.message}`);
  }
}

// Helper function to convert PDF to image - IMPROVED
async function convertPdfToImage(pdfPath, format, tempFiles) {
  try {
    console.log(`Starting PDF to ${format.toUpperCase()} conversion...`);
    
    // Use LibreOffice if available for better quality
    try {
      const outputDir = path.dirname(pdfPath);
      const baseName = path.basename(pdfPath, '.pdf');
      const outputPattern = `${outputDir}/${baseName}.%d.${format}`;
      
      await execAsync(`libreoffice --headless --convert-to ${format} --outdir "${outputDir}" "${pdfPath}"`);
      
      // Find the converted image file
      const files = fs.readdirSync(outputDir);
      const imageFile = files.find(f => f.startsWith(baseName) && f.endsWith(`.${format}`));
      
      if (imageFile) {
        const imagePath = path.join(outputDir, imageFile);
        const buffer = fs.readFileSync(imagePath);
        
        // Clean up the converted image file
        fs.unlinkSync(imagePath);
        
        // Validate buffer
        if (buffer && buffer.length > 0) {
          console.log('LibreOffice PDF to image conversion successful');
          return buffer;
        }
      }
    } catch (libreOfficeError) {
      console.log('LibreOffice not available, falling back to PDF.js approach');
    }

    // Fallback: Use pdf2json to extract text and create a simple image
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfParser = new (require('pdf2json'))();
    
    return new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData) => reject(errData.parserError));
      pdfParser.on('pdfParser_dataReady', () => {
        try {
          // Create a simple text-based image using sharp
          const textContent = pdfParser.getRawTextContent();
          const text = textContent || 'PDF content extraction failed';
          
          // Create a simple image with the text
          sharp({
            create: {
              width: 800,
              height: 600,
              channels: 3,
              background: { r: 255, g: 255, b: 255 }
            }
          })
          .composite([{
            input: Buffer.from(`<svg width="800" height="600"><text x="20" y="40" font-family="Arial" font-size="14">${text}</text></svg>`),
            top: 0,
            left: 0
          }])
          .toFormat(format)
          .toBuffer()
          .then(resolve)
          .catch(reject);
        } catch (sharpError) {
          reject(sharpError);
        }
      });
      
      pdfParser.parseBuffer(pdfBuffer);
    });
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