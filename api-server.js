import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Backend Environment Variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  process.exit(1);
}

console.log('🔗 Initializing Supabase client with URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Supabase connection
supabase.auth.getUser().then(({ data, error }) => {
  if (error) {
    console.log('⚠️  Supabase connection test failed:', error.message);
  } else {
    console.log('✅ Supabase client initialized successfully');
  }
});

// Enable CORS for frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow requests from frontend
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// API routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Sign up user
app.post('/api/supabase/sign-up', async (req, res) => {
  try {
    const { email, password, metadata } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      user: data.user,
      message: 'User signed up successfully' 
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in user
app.post('/api/supabase/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      session: data.session,
      user: data.user,
      message: 'User signed in successfully' 
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign out user
app.post('/api/supabase/sign-out', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Set the session to authenticate the request
    supabase.auth.setSession({ access_token: token, refresh_token: '' });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      message: 'User signed out successfully' 
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
app.post('/api/supabase/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/supabase/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track conversion
app.post('/api/conversions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { file_name, file_size, conversion_type, status } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!file_name || !file_size || !conversion_type || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('conversions')
      .insert({
        user_id: user.id,
        file_name,
        file_size,
        conversion_type,
        status
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      data: data[0],
      message: 'Conversion tracked successfully' 
    });
  } catch (error) {
    console.error('Track conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user conversions
app.get('/api/conversions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      data,
      message: 'Conversions retrieved successfully' 
    });
  } catch (error) {
    console.error('Get conversions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversion stats
app.get('/api/conversions/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const stats = {
      total_conversions: data.length,
      successful_conversions: data.filter((c: any) => c.status === 'completed').length,
      failed_conversions: data.filter((c: any) => c.status === 'failed').length,
      conversion_types: data.reduce((acc, curr) => {
        acc[curr.conversion_type] = (acc[curr.conversion_type] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({ 
      success: true, 
      stats,
      message: 'Conversion statistics retrieved successfully' 
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Backend server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});