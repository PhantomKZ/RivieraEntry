const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./src/db.js');

const app = express();
const PORT = process.env.PORT || 3000;

// --- ENV ---
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'riviera-secret-token';

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static: serve project root (index.html, admin.html, assets) ---
app.use(express.static(path.join(__dirname)));

// --- Auth ---
app.post('/api/auth/login', (req, res) => {
  try {
    const { login, password } = req.body || {};
    if (String(login) === String(ADMIN_LOGIN) && String(password) === String(ADMIN_PASSWORD)) {
      return res.json({ token: ADMIN_TOKEN, role: 'admin' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

function requireAuth(req, res, next){
  try {
    const header = req.headers['authorization'] || '';
    const [, token] = header.split(' ');
    if (token === ADMIN_TOKEN) return next();
  } catch {}
  return res.status(401).json({ error: 'Unauthorized' });
}

// --- Requests API ---
app.post('/api/requests', async (req, res) => {
  try {
    const created = await db.createRequest(req.body || {});
    res.json({ success: true, id: created.id });
  } catch (error) {
    console.error('Ошибка при сохранении заявки:', error);
    res.status(400).json({ success: false, error: error.message || 'Ошибка сервера' });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const { q, range } = req.query || {};
    const rows = await db.listRequests({ q, range });
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при загрузке заявок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/requests/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    await db.deleteRequest(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении заявки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Explicit routes for main pages (optional, but safe for SPA-less setup)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- Start ---
app.listen(PORT, '0.0.0.0', async () => {
  await db.init();
  console.log(`🌐 Сервер запущен на порту ${PORT}`);
  console.log(`DB: ${process.env.DB_PATH || path.join(__dirname, 'data', 'riviera.sqlite')}`);
});
