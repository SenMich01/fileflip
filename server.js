const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.use(cors({
  origin: 'https://fileflip.onrender.com'
}));
app.use(express.json());

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
