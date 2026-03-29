import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);