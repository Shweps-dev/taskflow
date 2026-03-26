const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/tasks - list all tasks for user
router.get('/', async (req, res) => {
  const { status, priority, category_id, search } = req.query;

  let query = `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1
  `;
  const params = [req.user.id];
  let idx = 2;

  if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
  if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
  if (category_id) { query += ` AND t.category_id = $${idx++}`; params.push(category_id); }
  if (search) { query += ` AND t.title ILIKE $${idx++}`; params.push(`%${search}%`); }

  query += ' ORDER BY t.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - single task
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - create task
router.post('/', async (req, res) => {
  const { title, description, status, priority, category_id, due_date } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority, category_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        title.trim(),
        description || null,
        status || 'todo',
        priority || 'medium',
        category_id || null,
        due_date || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - update task
router.put('/:id', async (req, res) => {
  const { title, description, status, priority, category_id, due_date } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, priority = $4,
           category_id = $5, due_date = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title.trim(), description || null, status, priority, category_id || null, due_date || null, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - quick status update
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/tasks/:id - delete task
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
