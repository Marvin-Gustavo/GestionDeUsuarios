import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  imageUrl: { type: String }, // Can be an external URL like Cloudinary
  category: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
