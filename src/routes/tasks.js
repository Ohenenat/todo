const router = require('express').Router();
const db = require('../config/db');
const authenticateToken = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all tasks for the authenticated user
router.get('/', async (req, res) => {
    try {
        const tasks = await db.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new task
router.post('/', async (req, res) => {
    try {
        const { title, description, due_date, reminder_time } = req.body;
        const newTask = await db.query(
            'INSERT INTO tasks (user_id, title, description, due_date, reminder_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, title, description, due_date, reminder_time]
        );
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, due_date, reminder_time, completed } = req.body;
        
        // Verify task belongs to user
        const task = await db.query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        
        if (task.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updatedTask = await db.query(
            `UPDATE tasks 
             SET title = $1, description = $2, due_date = $3, reminder_time = $4, 
                 completed = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND user_id = $7
             RETURNING *`,
            [title, description, due_date, reminder_time, completed, id, req.user.id]
        );

        res.json(updatedTask.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify task belongs to user
        const task = await db.query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        
        if (task.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;