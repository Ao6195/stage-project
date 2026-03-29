import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import Document from '../models/Document.js';

const router = express.Router();

// GET DOCUMENTS (Visibility Rules)
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    
    // Admin sees all. Users see 'approved' OR their own 'pending'.
    if (req.user.email !== 'adamouchkouk16@gmail.com') {
      query = {
        $or: [
          { status: 'approved' },
          { uploadedBy: req.user.id }
        ]
      };
    }

    const docs = await Document.find(query).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// APPROVE DOCUMENT (Admin Only)
router.put("/:id/approve", protect, isAdmin, async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id, 
      { status: 'approved' }, 
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Approval failed" });
  }
});

export default router;