import express from 'express';
import { adbListPackages, adbUninstall } from '../adb/adb.js';

const router = express.Router();

// GET /api/apps?device=xxx
router.get('/apps', async (req, res) => {
  try {
    const { device } = req.query;
    const result = await adbListPackages(device);
    const list = (result.stdout || '')
      .split(/\r?\n/)
      .map((line) => line.replace(/^package:/, '').trim())
      .filter(Boolean);
    res.json({ ok: true, list, raw: result.stdout });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/apps/:pkg?device=xxx
router.delete('/apps/:pkg', async (req, res) => {
  try {
    const { device } = req.query;
    const { pkg } = req.params;
    if (!pkg) return res.status(400).json({ ok: false, error: '缺少包名' });
    const result = await adbUninstall(pkg, device);
    const ok = result.code === 0 || /Success/i.test(result.stdout);
    res.json({ ok, stdout: result.stdout, stderr: result.stderr, code: result.code });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
