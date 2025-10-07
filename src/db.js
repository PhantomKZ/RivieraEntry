const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'riviera.sqlite');

let db;

function ensureDirExists(filePath){
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function init(){
  ensureDirExists(DB_PATH);
  db = new sqlite3.Database(DB_PATH);
  await run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdAt TEXT NOT NULL,
    fullName TEXT NOT NULL,
    destination TEXT NOT NULL,
    fromWhom TEXT,
    purpose TEXT NOT NULL,
    lang TEXT NOT NULL
  )`);
}

function run(sql, params = []){
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err){
      if (err) reject(err); else resolve(this);
    });
  });
}

function all(sql, params = []){
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

async function createRequest(payload){
  const now = payload.createdAt || new Date().toISOString();
  const fullName = (payload.fullName || '').trim();
  const destination = (payload.destination || '').trim();
  const fromWhom = (payload.fromWhom || '').trim();
  const purpose = (payload.purpose || '').trim();
  const lang = (payload.lang || 'ru').trim();
  if (!fullName || !destination || !purpose) {
    throw new Error('fullName, destination, purpose are required');
  }
  const res = await run(
    `INSERT INTO requests (createdAt, fullName, destination, fromWhom, purpose, lang)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [now, fullName, destination, fromWhom, purpose, lang]
  );
  return { id: res.lastID, createdAt: now, fullName, destination, fromWhom, purpose, lang };
}

function dateFromRange(range){
  if (!range || range === 'all') return null;
  const now = new Date();
  const from = new Date(now);
  switch(range){
    case 'day': from.setDate(now.getDate() - 1); break;
    case 'week': from.setDate(now.getDate() - 7); break;
    case 'month': from.setMonth(now.getMonth() - 1); break;
    case '3months': from.setMonth(now.getMonth() - 3); break;
    case '6months': from.setMonth(now.getMonth() - 6); break;
    case 'year': from.setFullYear(now.getFullYear() - 1); break;
    default: return null;
  }
  return from.toISOString();
}

async function listRequests({ q, range } = {}){
  const clauses = [];
  const params = [];
  const fromIso = dateFromRange(range);
  if (fromIso) { clauses.push('createdAt >= ?'); params.push(fromIso); }
  if (q && String(q).trim() !== ''){
    const like = `%${String(q).trim().toLowerCase()}%`;
    clauses.push(`(lower(fullName) LIKE ? OR lower(destination) LIKE ? OR lower(fromWhom) LIKE ? OR lower(purpose) LIKE ? OR lower(lang) LIKE ? OR lower(createdAt) LIKE ?)`);
    params.push(like, like, like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await all(`SELECT id, createdAt, fullName, destination, fromWhom, purpose, lang FROM requests ${where} ORDER BY datetime(createdAt) DESC`, params);
  return rows;
}

async function deleteRequest(id){
  if (!id || isNaN(id)) {
    throw new Error('Invalid request ID');
  }
  const res = await run('DELETE FROM requests WHERE id = ?', [id]);
  if (res.changes === 0) {
    throw new Error('Request not found');
  }
  return { success: true, deletedId: id };
}

async function deleteMultipleRequests(ids){
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('IDs array is required');
  }
  
  // Валидация всех ID
  const validIds = ids.filter(id => id && !isNaN(id));
  if (validIds.length === 0) {
    throw new Error('No valid IDs provided');
  }
  
  // Создаем плейсхолдеры для SQL запроса
  const placeholders = validIds.map(() => '?').join(',');
  const res = await run(`DELETE FROM requests WHERE id IN (${placeholders})`, validIds);
  
  return { 
    success: true, 
    deletedCount: res.changes,
    deletedIds: validIds 
  };
}

module.exports = { init, createRequest, listRequests, deleteRequest, deleteMultipleRequests };


