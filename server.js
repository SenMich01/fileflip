const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.use(cors({
  origin: 'https://fileflip-2.onrender.com'
}));
app.use(express.json());

// Only API routes here
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add all other API routes here

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
