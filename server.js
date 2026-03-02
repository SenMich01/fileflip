const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Handle ALL client-side routes — must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});