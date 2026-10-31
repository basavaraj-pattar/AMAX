import mongoose from 'mongoose'

const equipmentRequestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentListing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'closed'], default: 'pending', required: true }
}, { timestamps: true })

equipmentRequestSchema.index({ listing: 1, buyer: 1 }, { unique: true })
equipmentRequestSchema.index({ seller: 1, status: 1, updatedAt: -1 })

export default mongoose.model('EquipmentRequest', equipmentRequestSchema)
