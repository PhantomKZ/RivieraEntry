import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/requests", async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    await db.saveRequest(name, phone, message);
    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении заявки:", error);
    res.status(500).json({ success: false, error: "Ошибка сервера" });
  }
});

app.get("/api/requests", async (req, res) => {
  try {
    const requests = await db.getAllRequests();
    res.json(requests);
  } catch (error) {
    console.error("Ошибка при загрузке заявок:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", async () => {
  await db.init();
  console.log(`🌐 Сервер запущен на порту ${PORT}`);
});
