const supabase = require('../config/databaseBackend');

// Middleware to require admin role from Supabase
const requireAdmin = async (req, res, next) => {
  const userId = req.user.uid;

  // Look up user in Supabase
  const { data: user, error } = await supabase
    .from('usercredentials')
    .select('role')
    .eq('uid', userId)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // If not admin, return 403 (forbidden)
  if (user.role !== 'administrator') {
    return res.status(403).json({ error: 'Access denied - administrators only.' });
  }

  // Proceed to next handler
  next();
};

module.exports = { requireAdmin };