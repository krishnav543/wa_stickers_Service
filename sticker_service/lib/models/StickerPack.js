const mongoose = require('mongoose');

const stickerPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coverImageUrl: String,
  description: String,
  stickerCount: { type: Number, default: 0 },
  category: String,
  isPublic: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 }
}, { timestamps: true });

stickerPackSchema.index({ category: 1, isPublic: 1 });

module.exports = mongoose.model('StickerPack', stickerPackSchema);