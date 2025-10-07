const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname)));

// Auth (demo)
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body || {};
  
  // Определяем пользователей и их роли
  const users = {
    'admin': { password: 'admin', role: 'admin' },
    'reseption': { password: 'Riviera2025!', role: 'reseption' }
  };
  
  const user = users[login];
  const ok = user && user.password === password;
  
  if (!ok) return res.status(401).json({ message: 'Unauthorized' });
  
  res.json({ 
    token: `token-${login}-${Date.now()}`, 
    role: user.role,
    login: login 
  });
});

// Create request
app.post('/api/requests', async (req, res) => {
  try {
    const payload = req.body || {};
    const created = await db.createRequest(payload);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
});

// List requests with optional search and date range
app.get('/api/requests', async (req, res) => {
  try {
    const { q, range } = req.query;
    const rows = await db.listRequests({ q, range });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server Error' });
  }
});

// Delete request
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.deleteRequest(id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
});

// Delete multiple requests
app.delete('/api/requests', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs array is required' });
    }
    const results = await db.deleteMultipleRequests(ids);
    res.json(results);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
});

app.listen(PORT, async () => {
  await db.init();
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

