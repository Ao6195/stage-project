// backend/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Search for EITHER email OR username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Assign JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ token, user: { id: user._id, username: user.username, role: user.role } });

  } catch (error) {
    res.status(500).json({ message: "Server error during login." });
  }
};