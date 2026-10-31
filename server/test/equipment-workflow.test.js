import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import EquipmentListing from '../src/models/EquipmentListing.js'
import EquipmentRequest from '../src/models/EquipmentRequest.js'
import Notification from '../src/models/Notification.js'

test('equipment listings require seller-owned listing data and at least one valid price', async () => {
  const listing = new EquipmentListing({
    title: 'Cinema camera',
    category: 'Camera',
    condition: 'Good',
    location: 'Mumbai',
    description: 'Body with two batteries.',
    imageDataUrl: 'data:image/jpeg;base64,YQ==',
    salePrice: 2500,
    seller: new mongoose.Types.ObjectId()
  })

  await listing.validate()
  assert.equal(listing.active, true)
})

test('equipment request records enforce one request per buyer and listing', () => {
  const indexes = EquipmentRequest.schema.indexes()
  assert.ok(indexes.some(([keys, options]) =>
    keys.listing === 1 && keys.buyer === 1 && options.unique
  ))
  assert.deepEqual(EquipmentRequest.schema.path('status').enumValues, ['pending', 'approved', 'closed'])
})

test('notifications support equipment requests and approval links', () => {
  const types = Notification.schema.path('type').enumValues
  assert.ok(types.includes('equipment_request'))
  assert.ok(types.includes('equipment_request_approved'))
  assert.equal(Notification.schema.path('equipmentRequest').options.ref, 'EquipmentRequest')
  assert.equal(Notification.schema.path('equipmentListing').options.ref, 'EquipmentListing')
})
