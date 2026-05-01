const pool = require('../config/db');

// GET /api/tasks  (with filters: project_id, status, assignee_id, overdue)
const getTasks = async (req, res, next) => {
    try {
        const { project_id, status, assignee_id, overdue, my_tasks } = req.query;
        const conditions = [];
        const params = [];
        let idx = 1;

        // Members can only see tasks from their projects
        if (req.user.role !== 'admin') {
            conditions.push(`
        t.project_id IN (
            SELECT project_id FROM project_members WHERE user_id = $${idx++}
        )
        `);
            params.push(req.user.id);
        }

        if (project_id) { conditions.push(`t.project_id = $${idx++}`); params.push(project_id); }
        if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
        if (assignee_id) { conditions.push(`t.assignee_id = $${idx++}`); params.push(assignee_id); }
        if (my_tasks === 'true') { conditions.push(`t.assignee_id = $${idx++}`); params.push(req.user.id); }
        if (overdue === 'true') {
            conditions.push(`t.due_date < CURRENT_DATE AND t.status != 'done'`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT t.*,
            a.name AS assignee_name, a.avatar AS assignee_avatar,
            p.name AS project_name, p.color_index AS project_color
        FROM tasks t
        LEFT JOIN users a ON t.assignee_id = a.id
        LEFT JOIN projects p ON t.project_id = p.id
        ${where}
        ORDER BY
            CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
            t.due_date ASC NULLS LAST,
            t.created_at DESC`,
            params
        );

        res.json({ tasks: result.rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/tasks/:id
const getTask = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT t.*,
            a.name AS assignee_name, a.avatar AS assignee_avatar,
            p.name AS project_name, p.color_index AS project_color,
            c.name AS created_by_name
        FROM tasks t
        LEFT JOIN users a ON t.assignee_id = a.id
        LEFT JOIN users c ON t.created_by = c.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = $1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
        res.json({ task: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
    try {
        const { title, description, project_id, assignee_id, status = 'todo', priority = 'medium', due_date } = req.body;

        const result = await pool.query(
            `INSERT INTO tasks (title, description, project_id, assignee_id, status, priority, due_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [title, description, project_id, assignee_id || null, status, priority, due_date || null, req.user.id]
        );

        const task = result.rows[0];

        // Fetch with joined data
        const full = await pool.query(
            `SELECT t.*, a.name AS assignee_name, a.avatar AS assignee_avatar, p.name AS project_name
        FROM tasks t LEFT JOIN users a ON t.assignee_id = a.id LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = $1`,
            [task.id]
        );

        res.status(201).json({ task: full.rows[0] });
    } catch (err) {
        next(err);
    }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, assignee_id, due_date } = req.body;

        // Members can only update tasks assigned to them
        if (req.user.role !== 'admin') {
            const check = await pool.query('SELECT assignee_id, created_by FROM tasks WHERE id = $1', [req.params.id]);
            if (!check.rows.length) return res.status(404).json({ error: 'Task not found' });
            const t = check.rows[0];
            if (t.assignee_id !== req.user.id && t.created_by !== req.user.id) {
                return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
            }
        }

        const result = await pool.query(
            `UPDATE tasks SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            status = COALESCE($3, status),
            priority = COALESCE($4, priority),
            assignee_id = COALESCE($5, assignee_id),
            due_date = COALESCE($6, due_date),
            updated_at = NOW()
        WHERE id = $7
       RETURNING *`,
            [title, description, status, priority, assignee_id, due_date, req.params.id]
        );

        if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });

        const full = await pool.query(
            `SELECT t.*, a.name AS assignee_name, a.avatar AS assignee_avatar, p.name AS project_name
        FROM tasks t LEFT JOIN users a ON t.assignee_id = a.id LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = $1`,
            [result.rows[0].id]
        );

        res.json({ task: full.rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// GET /api/tasks/dashboard - aggregated stats
const getDashboardStats = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const scope = isAdmin
            ? `SELECT id FROM tasks`
            : `SELECT t.id FROM tasks t
            INNER JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ${uid}`;

        const stats = await pool.query(`
        WITH scoped AS (${scope})
        SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE t.status = 'todo') AS todo,
        COUNT(*) FILTER (WHERE t.status = 'inprogress') AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'done') AS done,
        COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'done') AS overdue
        FROM tasks t WHERE t.id IN (SELECT id FROM scoped)
    `);

        const projectStats = await pool.query(`
        SELECT p.id, p.name, p.color_index,
        COUNT(t.id) AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'done') AS done_tasks
        FROM projects p
        ${isAdmin ? '' : `INNER JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ${uid}`}
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id ORDER BY p.created_at DESC LIMIT 5
    `);

        const recentTasks = await pool.query(`
        SELECT t.id, t.title, t.status, t.priority, t.due_date,
        p.name AS project_name, a.name AS assignee_name, a.avatar AS assignee_avatar
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users a ON t.assignee_id = a.id
        ${isAdmin ? '' : `INNER JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ${uid}`}
        ORDER BY t.updated_at DESC LIMIT 8
    `);

        res.json({
            stats: stats.rows[0],
            projects: projectStats.rows,
            recentTasks: recentTasks.rows,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getDashboardStats };