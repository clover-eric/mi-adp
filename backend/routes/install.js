import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adbInstall } from '../adb/adb.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname || '.apk') || '.apk';
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB 上限
  fileFilter: (req, file, cb) => {
    if (!/\.apk$/i.test(file.originalname)) {
      return cb(new Error('仅支持 APK 文件'));
    }
    cb(null, true);
  },
});

// POST /api/install form-data: apk(file), device(optional)
router.post('/install', upload.single('apk'), async (req, res) => {
  const uploadedPath = req.file?.path;
  const { device } = req.body || {};
  if (!uploadedPath) {
    return res.status(400).json({ ok: false, error: '未接收到 APK 文件' });
  }
  try {
    const result = await adbInstall(uploadedPath, device);
    const ok = result.code === 0 || /Success/i.test(result.stdout);
    res.json({ ok, stdout: result.stdout, stderr: result.stderr, code: result.code });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    // 清理临时文件
    fs.promises.unlink(uploadedPath).catch(() => {});
  }
});

export default router;
