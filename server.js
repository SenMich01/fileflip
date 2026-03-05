import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.use(cors({
  origin: 'https://fileflip.onrender.com'
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
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
  try {
    const { targetFormat } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!targetFormat) {
      return res.status(400).json({ error: 'Target format not specified' });
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
      convertedBuffer = await convertPdfToImage(file.path, targetExtension);
      mimeType = targetExtension === 'jpg' ? 'image/jpeg' : 'image/png';
      filename = `${file.filename}.${targetExtension}`;
    }
    // Image to PDF conversion
    else if ((fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'webp') && targetExtension === 'pdf') {
      convertedBuffer = await convertImageToPdf(file.path);
      mimeType = 'application/pdf';
      filename = `${file.filename}.pdf`;
    }
    // EPUB to PDF conversion (placeholder - would need additional library)
    else if (fileExtension === 'epub' && targetExtension === 'pdf') {
      convertedBuffer = await convertEpubToPdf(file.path);
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
  }
});

// Helper function to convert PDF to image
async function convertPdfToImage(pdfPath, format) {
  // This is a simplified implementation
  // In a real application, you'd use a library like pdf-lib or pdf2pic
  // For now, return a placeholder error
  throw new Error('PDF to image conversion requires additional setup');
}

// Helper function to convert image to PDF
async function convertImageToPdf(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(imageBuffer);
  const page = pdfDoc.addPage();
  const { width, height } = image.scale(0.5);
  page.drawImage(image, {
    x: 50,
    y: 50,
    width,
    height,
  });
  return await pdfDoc.save();
}

// Helper function to convert EPUB to PDF
async function convertEpubToPdf(epubPath) {
  // This would require an EPUB parsing library
  // For now, return a placeholder error
  throw new Error('EPUB to PDF conversion requires additional setup');
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
