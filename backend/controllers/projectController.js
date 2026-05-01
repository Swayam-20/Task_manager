const pool = require('../config/db');

// GET /api/projects
const getProjects = async (req, res, next) => {
    try {
        let query, params;

        if (req.user.role === 'admin') {
            query = `
        SELECT p.*,
        u.name AS created_by_name,
        COUNT(DISTINCT pm.user_id) AS member_count,
        COUNT(DISTINCT t.id) AS task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `;
            params = [];
        } else {
            query = `
        SELECT p.*,
          u.name AS created_by_name,
          COUNT(DISTINCT pm2.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_count
        FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN project_members pm2 ON p.id = pm2.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);

        // Fetch members for each project
        const projects = await Promise.all(
            result.rows.map(async (proj) => {
                const members = await pool.query(
                    `SELECT u.id, u.name, u.email, u.role, u.avatar
           FROM users u INNER JOIN project_members pm ON u.id = pm.user_id
           WHERE pm.project_id = $1`,
                    [proj.id]
                );
                return { ...proj, members: members.rows };
            })
        );

        res.json({ projects });
    } catch (err) {
        next(err);
    }
};

// GET /api/projects/:id
const getProject = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.name AS created_by_name
       FROM projects p LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });

        const members = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.avatar
       FROM users u INNER JOIN project_members pm ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
            [req.params.id]
        );

        const tasks = await pool.query(
            `SELECT t.*, u.name AS assignee_name, u.avatar AS assignee_avatar
       FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = $1 ORDER BY t.created_at DESC`,
            [req.params.id]
        );

        res.json({ project: { ...result.rows[0], members: members.rows, tasks: tasks.rows } });
    } catch (err) {
        next(err);
    }
};

// POST /api/projects
const createProject = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { name, description, color_index = 0, member_ids = [] } = req.body;

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO projects (name, description, color_index, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, color_index, req.user.id]
        );
        const project = result.rows[0];

        // Add creator as member
        const allMembers = [...new Set([req.user.id, ...member_ids.map(Number)])];
        for (const uid of allMembers) {
            await client.query(
                'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [project.id, uid]
            );
        }

        await client.query('COMMIT');

        const members = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.avatar
       FROM users u INNER JOIN project_members pm ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
            [project.id]
        );

        res.status(201).json({ project: { ...project, members: members.rows } });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
    try {
        const { name, description, color_index } = req.body;
        const result = await pool.query(
            `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        color_index = COALESCE($3, color_index),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
            [name, description, color_index, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
        res.json({ project: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// POST /api/projects/:id/members
const addMember = async (req, res, next) => {
    try {
        const { user_id } = req.body;
        await pool.query(
            'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.params.id, user_id]
        );
        res.json({ message: 'Member added successfully' });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
    try {
        await pool.query(
            'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
            [req.params.id, req.params.userId]
        );
        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };