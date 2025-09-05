import express from 'express';
import { adbConnect } from '../adb/adb.js';
import { isValidIp } from '../utils/validators.js';

const router = express.Router();

// POST /api/connect { ip: string }
router.post('/connect', async (req, res) => {
  try {
    const { ip } = req.body || {};
    if (!ip || !isValidIp(ip)) {
      return res.status(400).json({ ok: false, error: '无效的 IP 地址' });
    }
    const target = `${ip}:5555`;
    const result = await adbConnect(target);
    const ok = result.code === 0 && /connected to|already connected/i.test(result.stdout);
    res.json({ ok, stdout: result.stdout, stderr: result.stderr, code: result.code, target });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
