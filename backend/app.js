import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectRouter from './routes/connect.js';
import installRouter from './routes/install.js';
import appsRouter from './routes/apps.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 确保上传目录存在
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend', ts: Date.now() });
});

app.use('/api', connectRouter);
app.use('/api', installRouter);
app.use('/api', appsRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '内部服务器错误', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});
