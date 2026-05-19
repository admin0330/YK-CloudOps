import express from 'express';
import mysql from 'mysql2/promise';
import { STATIC_SECTIONS } from '../../shared/jsStudyContent.js';

const router = express.Router();

let pool;

function getDbConfig() {
  const host = process.env.JS_STUDY_DB_HOST;
  const user = process.env.JS_STUDY_DB_USER;
  const password = process.env.JS_STUDY_DB_PASSWORD;
  const database = process.env.JS_STUDY_DB_NAME;
  if (!host || !user || !database) return null;
  return {
    host,
    port: Number(process.env.JS_STUDY_DB_PORT || 3306),
    user,
    password: password || '',
    database,
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
  };
}

function getPool() {
  const config = getDbConfig();
  if (!config) return null;
  if (!pool) {
    pool = mysql.createPool(config);
  }
  return pool;
}

function normalizeSections(rows = []) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    code: row.code,
    task: row.task,
    tags: Array.isArray(row.tags)
      ? row.tags
      : typeof row.tags === 'string'
        ? JSON.parse(row.tags || '[]')
        : [],
  }));
}

async function loadFromMysql() {
  const db = getPool();
  if (!db) {
    throw new Error('MySQL config missing');
  }

  const [rows] = await db.query(`
    SELECT id, title, body, code, task, tags
    FROM js_study_sections
    WHERE published = 1
    ORDER BY sort_order ASC, created_at ASC
  `);

  return normalizeSections(rows);
}

router.get('/js-study/sections', async (req, res) => {
  const mode = String(req.query.mode || 'auto').toLowerCase();

  if (mode === 'static') {
    return res.json({
      source: 'static',
      fallback: false,
      sections: STATIC_SECTIONS,
    });
  }

  try {
    const sections = await loadFromMysql();
    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('No MySQL sections');
    }

    return res.json({
      source: 'mysql',
      fallback: false,
      sections,
    });
  } catch (error) {
    if (mode === 'mysql') {
      return res.status(503).json({
        source: 'static',
        fallback: true,
        error: 'MySQL unavailable',
        sections: STATIC_SECTIONS,
      });
    }

    return res.json({
      source: 'static',
      fallback: true,
      sections: STATIC_SECTIONS,
    });
  }
});

export default router;
