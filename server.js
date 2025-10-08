import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();
const DB_FILE = path.join(__dirname, "db", "db.json");
const USERS = [
  { login: "admin", password: "admin", role: "admin" },
  { login: "reseption", password: "Riviera2025!", role: "reseption" }
];
const SECRET = process.env.SECRET || "riviera_secret";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// read db
function readDB(){
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const txt = fs.readFileSync(DB_FILE, "utf-8") || "[]";
    return JSON.parse(txt);
  } catch(e){ console.error("readDB error", e); return []; }
}

function writeDB(data){
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// simple token: HMAC of role with secret + timestamp
function genToken(role){
  const payload = JSON.stringify({ role, t: Date.now() });
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + sig;
}

function validateToken(token){
  try {
    const [b64, sig] = token.split(".");
    const payload = Buffer.from(b64, "base64").toString("utf-8");
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (expected !== sig) return null;
    const obj = JSON.parse(payload);
    // optional expiry 7 days
    if (Date.now() - obj.t > 1000*60*60*24*7) return null;
    return obj;
  } catch(e){ return null; }
}

// login
app.post("/api/login", (req, res) => {
  const { login, password } = req.body || {};
  const u = USERS.find(x=>x.login === login && x.password === password);
  if (!u) return res.json({ success: false });
  const token = genToken(u.role);
  return res.json({ success: true, token, role: u.role });
});

// validate token
app.get("/api/validate", (req, res) => {
  const h = req.headers.authorization || "";
  const token = h.replace(/^Bearer\s+/i,"");
  const obj = validateToken(token);
  if (!obj) return res.status(401).json({ error: "invalid" });
  return res.json({ role: obj.role });
});

// post request
app.post("/api/requests", (req, res) => {
  const data = readDB();
  const newReq = req.body || {};
  newReq.createdAt = newReq.createdAt || new Date().toISOString();
  data.push(newReq);
  writeDB(data);
  return res.json({ success: true });
});

// get requests (requires auth)
app.get("/api/requests", (req, res) => {
  const h = req.headers.authorization || "";
  const token = h.replace(/^Bearer\s+/i,"");
  const obj = validateToken(token);
  if (!obj) return res.status(401).json({ error: "unauthorized" });
  const data = readDB();
  return res.json(data);
});

// delete selected (admin only)
app.post("/api/requests/delete", (req, res) => {
  const h = req.headers.authorization || "";
  const token = h.replace(/^Bearer\s+/i,"");
  const obj = validateToken(token);
  if (!obj || obj.role !== "admin") return res.status(401).json({ error: "unauthorized" });
  const ids = req.body.ids || [];
  let data = readDB();
  // ids correspond to indices as used in admin table; remove by index
  // create new array excluding indices
  const keep = data.filter((_, idx) => !ids.includes(idx));
  writeDB(keep);
  return res.json({ success: true });
});

// serve admin page from /admin route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// fallback to index.html for SPA-like behaviour
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  if (!fs.existsSync(path.join(__dirname, "db"))) fs.mkdirSync(path.join(__dirname, "db"));
  if (!fs.existsSync(DB_FILE)) writeDB([]);
  console.log(`🌐 Server started on port ${PORT}`);
});
