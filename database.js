import sqlite3 from "sqlite3";
import { open } from "sqlite";

let db;

export async function init() {
  db = await open({
    filename: "./data/riviera.sqlite",
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function saveRequest(name, phone, message) {
  await db.run("INSERT INTO requests (name, phone, message) VALUES (?, ?, ?)", [name, phone, message]);
}

export async function getAllRequests() {
  return await db.all("SELECT * FROM requests ORDER BY created_at DESC");
}

export default { init, saveRequest, getAllRequests };
