import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import FileValidator from '../utils/fileValidator.js';
import ConversionService from '../services/conversionService.js';
import TempFileManager from '../utils/tempFileManager.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TempFileManager.UPLOAD_DIR);
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
    const validation = FileValidator.validateFile(file);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.error), false);
    }
  }
});

/**
 * POST /api/convert
 * Convert uploaded file to target format
 */
router.post('/convert', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  let convertedFilePath = null;
  
  try {
    const { targetFormat } = req.body;
    const file = req.file;

    console.log('Conversion request received:', {
      originalName: file?.originalname,
      targetFormat: targetFormat,
      fileSize: file?.size
    });

    // Validate file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!targetFormat) {
      return res.status(400).json({ error: 'Target format not specified' });
    }

    // Validate conversion
    const inputExtension = file.originalname.split('.').pop()?.toLowerCase();
    const conversionValidation = FileValidator.validateConversion(inputExtension, targetFormat);
    
    if (!conversionValidation.valid) {
      return res.status(400).json({ error: conversionValidation.error });
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

    // Check credits for authenticated users (except magboyin14@gmail.com)
    if (user && profile) {
      // Grant unlimited credits to magboyin14@gmail.com
      if (user.email === 'magboyin14@gmail.com') {
        console.log('Unlimited credits granted to magboyin14@gmail.com');
      } else {
        const isPro = profile.plan_type === 'Pro' && new Date(profile.pro_expires_at) > new Date();
        const hasCredits = (profile.credits || 0) > 0;

        if (!isPro && !hasCredits) {
          return res.status(403).json({ error: 'Insufficient credits' });
        }

        // Deduct credit if not Pro and not magboyin14@gmail.com
        if (!isPro && user.email !== 'magboyin14@gmail.com') {
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
    const targetExtension = ConversionService.getFileExtension(targetFormat);
    const outputFilename = `${baseName}_${timestamp}.${targetExtension}`;

    console.log('Starting conversion:', {
      inputPath: uploadedFilePath,
      outputPath: outputFilename,
      targetFormat: targetFormat
    });

    // Perform conversion based on file type and target format
    let mimeType;
    let outputPath;

    // PDF to Image conversion
    if (inputExtension === 'pdf' && (targetExtension === 'jpg' || targetExtension === 'png')) {
      outputPath = await ConversionService.convertPdfToImage(uploadedFilePath, outputFilename, targetExtension);
      mimeType = ConversionService.getMimeType(targetExtension);
    }
    // PDF to Word conversion
    else if (inputExtension === 'pdf' && targetExtension === 'docx') {
      outputPath = await ConversionService.convertPdfToDocx(uploadedFilePath, outputFilename);
      mimeType = ConversionService.getMimeType(targetExtension);
    }
    // Image to PDF conversion
    else if ((inputExtension === 'jpg' || inputExtension === 'jpeg' || inputExtension === 'png' || inputExtension === 'webp') && targetExtension === 'pdf') {
      outputPath = await ConversionService.convertImageToPdf(uploadedFilePath, outputFilename);
      mimeType = ConversionService.getMimeType(targetExtension);
    }
    // EPUB to PDF conversion
    else if (inputExtension === 'epub' && targetExtension === 'pdf') {
      outputPath = await ConversionService.convertEpubToPdf(uploadedFilePath, outputFilename);
      mimeType = ConversionService.getMimeType(targetExtension);
    }
    else {
      return res.status(400).json({ error: 'Unsupported conversion' });
    }

    // Validate converted file
    const validation = FileValidator.validateConvertedFile(outputPath);
    if (!validation.valid) {
      return res.status(500).json({ error: validation.error });
    }

    console.log('Conversion completed successfully:', {
      outputPath: outputPath,
      fileSize: validation.size
    });

    // Download the converted file
    res.download(outputPath, outputFilename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      } else {
        console.log('File downloaded successfully:', outputFilename);
      }
    });

    // Clean up converted file after download
    res.on('finish', () => {
      try {
        if (outputPath && TempFileManager.isValidFile(outputPath)) {
          TempFileManager.deleteFile(outputPath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up converted file:', cleanupError);
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Return JSON error instead of corrupt file
    if (error.message.includes('Mock Converted File') || error.message.includes('placeholder')) {
      return res.status(500).json({ 
        error: 'Conversion failed: Invalid content detected',
        details: 'The conversion system encountered placeholder content. Please try again.'
      });
    }
    
    return res.status(500).json({ 
      error: 'Conversion failed',
      details: error.message 
    });
  } finally {
    // Clean up uploaded file
    try {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        TempFileManager.deleteFile(uploadedFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded file:', cleanupError);
    }
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/conversion-info
 * Get information about supported conversions
 */
router.get('/conversion-info', (req, res) => {
  const supportedConversions = {
    'pdf': ['jpg', 'png', 'docx'],
    'jpg': ['pdf'],
    'jpeg': ['pdf'],
    'png': ['pdf'],
    'webp': ['pdf'],
    'epub': ['pdf']
  };

  const info = {
    supportedFormats: FileValidator.getAllowedExtensions(),
    supportedConversions: supportedConversions,
    maxFileSize: '50MB',
    tempDir: TempFileManager.TEMP_DIR,
    timestamp: new Date().toISOString()
  };

  res.json(info);
});

export default router;