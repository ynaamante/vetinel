// Simple auth middleware stubs. Replace with real auth as needed.
module.exports = {
  optional: (req, res, next) => next(),
  required: (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    if (process.env.API_TOKEN && token !== process.env.API_TOKEN) return res.status(403).json({ error: 'Forbidden' });
    next();
  },
};
