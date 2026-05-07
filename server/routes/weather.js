import { Router } from 'express';
import { getWeatherForRequest } from '../services/weather.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// GET /api/weather/current?city= (optional manual city)
router.get('/weather/current', requireAuth, async (req, res) => {
  try {
    const manualCity = req.query.city?.trim() || '';
    const result = await getWeatherForRequest(req, manualCity || undefined);
    res.json(result);
  } catch (err) {
    console.error('Weather error:', err.message?.slice(0, 100) || err.message);
    res.status(500).json({ success: false, error: 'Weather service unavailable' });
  }
});

export default router;
