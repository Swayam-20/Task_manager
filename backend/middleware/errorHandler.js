const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ${err.stack}`);

    // Postgres unique violation
    if (err.code === '23505') {
        return res.status(409).json({ error: 'A record with this value already exists.' });
    }
    // Postgres foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Referenced record does not exist.' });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

const notFound = (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFound };