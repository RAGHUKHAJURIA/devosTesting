/**
 * Admin authentication middleware.
 * Checks for the ADMIN_SECRET token in the Authorization header.
 * Header format: Authorization: Bearer <ADMIN_SECRET>
 */
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No admin token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid admin token',
    });
  }

  next();
};

module.exports = adminAuth;
