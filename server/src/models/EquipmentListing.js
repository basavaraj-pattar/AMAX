import mongoose from 'mongoose'

const equipmentListingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  condition: { type: String, required: true, trim: true, maxlength: 80 },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  imageDataUrl: { type: String, required: true, maxlength: 1_600_000 },
  listingType: { type: String, enum: ['sale', 'rent', 'exchange'] },
  salePrice: { type: Number, min: 0, default: null },
  rentalPrice: { type: Number, min: 0, default: null },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true })

equipmentListingSchema.index({ createdAt: -1, seller: 1 })

export default mongoose.model('EquipmentListing', equipmentListingSchema)
