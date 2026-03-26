const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(t.id)::int as task_count
       FROM categories c
       LEFT JOIN tasks t ON c.id = t.category_id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name.trim(), color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1, color = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name.trim(), color || '#6366f1', req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
