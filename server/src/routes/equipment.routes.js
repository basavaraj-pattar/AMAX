import { Router } from 'express'
import mongoose from 'mongoose'
import EquipmentListing from '../models/EquipmentListing.js'
import EquipmentRequest from '../models/EquipmentRequest.js'
import Notification from '../models/Notification.js'
import { optionalProtect, protect } from '../middleware/auth.js'

const router = Router()
const sellerFields = 'name username avatarUrl'
const imageDataUrlPattern = /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/

function listingForClient(listing) {
  return {
    id: String(listing._id),
    title: listing.title,
    category: listing.category,
    condition: listing.condition,
    location: listing.location,
    description: listing.description,
    image: listing.imageDataUrl,
    listingType: listing.listingType || (listing.rentalPrice != null ? 'rent' : listing.salePrice != null ? 'sale' : 'exchange'),
    salePrice: listing.salePrice ?? '',
    rentalPrice: listing.rentalPrice ?? '',
    seller: listing.seller?.name || 'AMAX seller',
    sellerUsername: listing.seller?.username || '',
    sellerId: String(listing.seller?._id || listing.seller),
    sellerAvatarUrl: listing.seller?.avatarUrl || '',
    active: Boolean(listing.active),
    createdAt: listing.createdAt
  }
}

function validPrice(value) {
  return value === undefined || value === null || value === '' ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)
}

async function ensureBuyerApprovalNotification(req, request) {
  const eventKey = `equipment-approved:${request._id}`
  const result = await Notification.updateOne(
    { eventKey },
    { $setOnInsert: {
      recipient: request.buyer,
      actor: request.seller,
      equipmentListing: request.listing,
      equipmentRequest: request._id,
      type: 'equipment_request_approved',
      eventKey
    } },
    { upsert: true }
  )
  const notification = await Notification.findOne({ eventKey }).select('_id')
  if (!notification) throw new Error('Unable to record the buyer approval notification.')
  if (result.upsertedCount) {
    req.app.get('io')?.to(`user:${request.buyer}`).emit('notification:new', {
      _id: notification._id,
      type: 'equipment_request_approved'
    })
  }
}

router.get('/mine', protect, async (req, res, next) => {
  try {
    const listings = await EquipmentListing.find({ seller: req.user._id })
      .populate('seller', sellerFields)
      .sort('-createdAt')
      .limit(500)
    res.json(listings.map(listingForClient))
  } catch (error) { next(error) }
})

router.get('/', optionalProtect, async (_req, res, next) => {
  try {
    const listings = await EquipmentListing.find({ active: true })
      .populate('seller', sellerFields)
      .sort('-createdAt')
      .limit(100)
    res.json(listings.map(listingForClient))
  } catch (error) { next(error) }
})

router.post('/', protect, async (req, res, next) => {
  try {
    const { title, category, condition, location, description, imageDataUrl, listingType, salePrice, rentalPrice } = req.body || {}
    const hasSalePrice = salePrice !== '' && salePrice != null
    const hasRentalPrice = rentalPrice !== '' && rentalPrice != null
    const resolvedListingType = listingType ?? (hasRentalPrice ? 'rent' : hasSalePrice ? 'sale' : 'exchange')
    const validListingType = ['sale', 'rent', 'exchange'].includes(resolvedListingType)
    const validTypePrice = listingType == null
      ? (hasSalePrice || hasRentalPrice)
      : resolvedListingType === 'sale'
        ? hasSalePrice && !hasRentalPrice
        : resolvedListingType === 'rent'
          ? hasRentalPrice && !hasSalePrice
          : !hasSalePrice && !hasRentalPrice
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 160
      || typeof category !== 'string' || !category.trim() || category.trim().length > 80
      || typeof condition !== 'string' || !condition.trim() || condition.trim().length > 80
      || typeof location !== 'string' || !location.trim() || location.trim().length > 120
      || typeof description !== 'string' || !description.trim() || description.trim().length > 3000
      || typeof imageDataUrl !== 'string' || imageDataUrl.length > 1_600_000 || !imageDataUrlPattern.test(imageDataUrl)
      || !validListingType || !validTypePrice
      || !validPrice(salePrice) || !validPrice(rentalPrice)
      ) {
      return res.status(400).json({ message: 'Equipment listing details are invalid.' })
    }
    const listing = await EquipmentListing.create({
      title: title.trim(),
      category: category.trim(),
      condition: condition.trim(),
      location: location.trim(),
      description: description.trim(),
      imageDataUrl,
      listingType: resolvedListingType,
      salePrice: salePrice === '' || salePrice == null ? null : salePrice,
      rentalPrice: rentalPrice === '' || rentalPrice == null ? null : rentalPrice,
      seller: req.user._id
    })
    await listing.populate('seller', sellerFields)
    const clientListing = listingForClient(listing)
    req.app.get('io')?.emit('equipment:listing:created', clientListing)
    res.status(201).json(clientListing)
  } catch (error) { next(error) }
})

router.patch('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Equipment listing not found.' })
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}
    const allowedFields = new Set(['imageDataUrl', 'description'])
    const keys = Object.keys(body)
    if (!keys.length || keys.some(key => !allowedFields.has(key))) {
      return res.status(400).json({ message: 'Only the listing photo and description can be changed here.' })
    }
    if (Object.hasOwn(body, 'imageDataUrl') && (typeof body.imageDataUrl !== 'string' || body.imageDataUrl.length > 1_600_000 || !imageDataUrlPattern.test(body.imageDataUrl))) {
      return res.status(400).json({ message: 'Choose a valid image smaller than 1.2 MB.' })
    }
    if (Object.hasOwn(body, 'description') && (typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 3000)) {
      return res.status(400).json({ message: 'The listing description must be between 1 and 3,000 characters.' })
    }
    const updates = {}
    if (Object.hasOwn(body, 'imageDataUrl')) updates.imageDataUrl = body.imageDataUrl
    if (Object.hasOwn(body, 'description')) updates.description = body.description.trim()
    const listing = await EquipmentListing.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('seller', sellerFields)
    if (!listing) return res.status(404).json({ message: 'Your equipment listing could not be found.' })
    const clientListing = listingForClient(listing)
    req.app.get('io')?.emit('equipment:listing:updated', clientListing)
    res.json(clientListing)
  } catch (error) { next(error) }
})

router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Equipment listing not found.' })
    const listing = await EquipmentListing.findOneAndDelete({ _id: req.params.id, seller: req.user._id })
    if (!listing) return res.status(404).json({ message: 'Your equipment listing could not be found.' })
    const requests = await EquipmentRequest.find({ listing: listing._id }).select('_id').lean()
    const requestIds = requests.map(request => request._id)
    await Promise.all([
      EquipmentRequest.deleteMany({ listing: listing._id }),
      Notification.deleteMany({ $or: [
        { equipmentListing: listing._id },
        ...(requestIds.length ? [{ equipmentRequest: { $in: requestIds } }] : [])
      ] })
    ])
    req.app.get('io')?.emit('equipment:listing:removed', { listingId: String(listing._id) })
    res.json({ deleted: true, listingId: String(listing._id) })
  } catch (error) { next(error) }
})

router.get('/chat-context/:participantId', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.participantId)) return res.json(null)
    const otherId = req.params.participantId
    // Only return an active equipment request that is pending, so closed listings never block other items
    const request = await EquipmentRequest.findOne({
      $or: [
        { seller: req.user._id, buyer: otherId, status: 'pending' },
        { buyer: req.user._id, seller: otherId, status: 'pending' }
      ]
    }).sort('-updatedAt').populate('listing')

    if (!request || !request.listing || !request.listing.active) return res.json(null)

    const isSeller = String(request.seller) === String(req.user._id)
    return res.json({
      listingId: String(request.listing._id),
      listingTitle: request.listing.title,
      requestId: String(request._id),
      role: isSeller ? 'seller' : 'buyer',
      status: request.status,
      active: request.listing.active
    })
  } catch (error) { next(error) }
})

router.get('/:id/request', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Equipment listing not found.' })
    const listing = await EquipmentListing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Equipment listing not found.' })
    const isSeller = listing.seller.equals(req.user._id)
    const requestedRequestId = typeof req.query.request === 'string' && mongoose.isValidObjectId(req.query.request)
      ? req.query.request
      : null
    const requestedBuyerId = typeof req.query.buyer === 'string' && mongoose.isValidObjectId(req.query.buyer)
      ? req.query.buyer
      : null
    const filter = isSeller
      ? { listing: listing._id, seller: req.user._id, status: { $in: ['pending', 'approved'] }, ...(requestedRequestId ? { _id: requestedRequestId } : {}), ...(requestedBuyerId ? { buyer: requestedBuyerId } : {}) }
      : { listing: listing._id, buyer: req.user._id, ...(requestedRequestId ? { _id: requestedRequestId } : {}) }
    const request = await EquipmentRequest.findOne(filter).sort('-createdAt').populate('buyer', sellerFields)
    res.json({
      role: isSeller ? 'seller' : 'buyer',
      active: listing.active,
      listingId: String(listing._id),
      listingTitle: listing.title,
      requestId: request ? String(request._id) : null,
      status: request?.status || 'none',
      buyer: request?.buyer ? {
        id: String(request.buyer._id),
        name: request.buyer.name,
        username: request.buyer.username
      } : null
    })
  } catch (error) { next(error) }
})

router.post('/:id/request', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Equipment listing not found.' })
    const listing = await EquipmentListing.findOne({ _id: req.params.id, active: true })
    if (!listing) return res.status(404).json({ message: 'This equipment listing is no longer available.' })
    if (listing.seller.equals(req.user._id)) return res.status(403).json({ message: 'You cannot request your own listing.' })

    let request = await EquipmentRequest.findOne({ listing: listing._id, buyer: req.user._id })
    if (request?.status === 'approved') return res.status(409).json({ message: 'This request has already been approved.' })
    if (!request) {
      try {
        request = await EquipmentRequest.create({
          listing: listing._id,
          buyer: req.user._id,
          seller: listing.seller
        })
      } catch (error) {
        if (error.code !== 11000) throw error
        request = await EquipmentRequest.findOne({ listing: listing._id, buyer: req.user._id })
        if (!request) throw error
      }
    }
    const eventKey = `equipment-request:${request._id}`
    const notificationResult = await Notification.updateOne(
      { eventKey },
      { $setOnInsert: {
        recipient: listing.seller,
        actor: req.user._id,
        equipmentListing: listing._id,
        equipmentRequest: request._id,
        type: 'equipment_request',
        eventKey
      } },
      { upsert: true }
    )
    const notification = await Notification.findOne({ eventKey }).select('_id')
    if (!notification) return res.status(500).json({ message: 'Unable to send the seller your request notification.' })
    if (notificationResult.upsertedCount) {
      req.app.get('io')?.to(`user:${listing.seller}`).emit('notification:new', { _id: notification._id, type: 'equipment_request' })
    }
    req.app.get('io')?.to(`user:${listing.seller}`).emit('equipment:request:updated', {
      listingId: String(listing._id),
      requestId: String(request._id),
      status: request.status
    })
    res.status(201).json({ requestId: String(request._id), status: request.status, role: 'buyer', active: true, listingId: String(listing._id), listingTitle: listing.title })
  } catch (error) { next(error) }
})

router.patch('/requests/:requestId/approve', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.requestId)) return res.status(404).json({ message: 'Equipment request not found.' })
    const request = await EquipmentRequest.findOne({ _id: req.params.requestId, seller: req.user._id })
    if (!request) return res.status(404).json({ message: 'Pending equipment request not found.' })
    let listingId
    if (request.status === 'pending') {
      const listing = await EquipmentListing.findOneAndUpdate(
        { _id: request.listing, seller: req.user._id, active: true },
        { $set: { active: false } },
        { new: true }
      )
      if (!listing) return res.status(409).json({ message: 'This equipment listing is no longer available.' })
      listingId = listing._id
      request.status = 'approved'
      try {
        await request.save()
      } catch (error) {
        await EquipmentListing.updateOne({ _id: listing._id, seller: req.user._id, active: false }, { $set: { active: true } })
        throw error
      }
    } else if (request.status === 'approved') {
      listingId = request.listing
    } else {
      return res.status(409).json({ message: 'This equipment request is no longer pending.' })
    }
    await EquipmentRequest.updateMany(
      { listing: listingId, _id: { $ne: request._id }, status: 'pending' },
      { $set: { status: 'closed' } }
    )
    await Notification.updateMany(
      { equipmentListing: listingId, type: 'equipment_request', readAt: null },
      { $set: { readAt: new Date() } }
    )
    await Notification.updateOne(
      { eventKey: `equipment-request:${request._id}`, recipient: req.user._id },
      { $set: { readAt: new Date() } }
    )
    await ensureBuyerApprovalNotification(req, request)
    const io = req.app.get('io')
    const updatePayload = { listingId: String(listingId), requestId: String(request._id), status: 'approved', active: false }
    io?.to(`user:${request.buyer}`).emit('equipment:request:updated', updatePayload)
    io?.to(`user:${req.user._id}`).emit('equipment:request:updated', updatePayload)
    io?.emit('equipment:listing:removed', { listingId: String(listingId) })
    res.json({ requestId: String(request._id), status: request.status, listingId: String(listingId), listingActive: false })
  } catch (error) { next(error) }
})

router.get('/:id', optionalProtect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Equipment listing not found.' })
    const listing = await EquipmentListing.findOne({ _id: req.params.id, active: true }).populate('seller', sellerFields)
    if (!listing) return res.status(404).json({ message: 'Equipment listing not found.' })
    res.json(listingForClient(listing))
  } catch (error) { next(error) }
})

export default router
