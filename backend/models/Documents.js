import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true }, // Cloudinary secure_url
  cloudinaryId: { type: String, required: true }, // For deleting files later
  
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Visibility & Vault Logic
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // Categorization
  category: { 
    type: String, 
    enum: ['Security', 'Data', 'System', 'Development'], 
    required: true 
  },
  
  // Analytics
  views: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);