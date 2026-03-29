import jwt from 'jsonwebtoken';

// Standard Auth
export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed" });
  }
};

// TITAN ULTRA ADMIN CHECK
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'adamouchkouk16@gmail.com') {
    next();
  } else {
    res.status(403).json({ message: "Access Denied: Admin only." });
  }
};