import mongoose from 'mongoose'

const trailerSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  watchUrl: { type: String, required: true },
  channelTitle: { type: String, default: '' },
  language: { type: String, default: '' },
  regionCode: { type: String, default: '' },
  category: { type: String, default: 'WORLD CINEMA' },
  viewCount: { type: Number, default: 0 },
  publishedAt: { type: Date, default: null }
}, { _id: false })

const weeklyShowcaseSchema = new mongoose.Schema({
  weekKey: { type: String, required: true, unique: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  generatedAt: { type: Date, default: Date.now },
  youtubeConfigured: { type: Boolean, default: false },
  youtubeSearchCount: { type: Number, default: 0 },
  youtubeFailedSearches: { type: Number, default: 0 },
  youtubeError: { type: String, default: '', maxlength: 360 },
  manualRefreshAt: { type: Date, default: null },
  festivalScanAt: { type: Date, default: null },
  festivalSourceCount: { type: Number, default: 0 },
  festivalCheckedCount: { type: Number, default: 0 },
  festivalOpportunityCount: { type: Number, default: 0 },
  festivalPublishedCount: { type: Number, default: 0 },
  festivalScanErrorCount: { type: Number, default: 0 },
  trailers: { type: [trailerSchema], default: [] }
}, { timestamps: true })

export default mongoose.model('WeeklyShowcase', weeklyShowcaseSchema)
