import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  
  // Role-Based Access Control
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Password Recovery Flow
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },

  // Activity Tracking for the Chart.js Analytics
  activityLog: [{
    date: { type: Date, default: Date.now },
    action: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);