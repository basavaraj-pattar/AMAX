import Community from '../models/Community.js'

export const DEFAULT_COMMUNITIES = [
  { name: 'Independent Filmmakers', slug: 'independent-filmmakers', description: 'A home for the brave, scrappy, and self-funded.', membersCountBase: 12400, channelDescription: 'Share works in progress, find collaborators, and talk through the craft.' },
  { name: 'Screenwriters Room', slug: 'screenwriters-room', description: 'Pages, premises, and the messy middle.', membersCountBase: 8700, channelDescription: 'Discuss story ideas, pages, structure, and the writing process.' },
  { name: 'Cinematographers', slug: 'cinematographers', description: 'Light chasers and lens obsessives.', membersCountBase: 5200, channelDescription: 'Trade lighting setups, references, camera tests, and lens notes.' },
  { name: 'Vintage Camera Collectors', slug: 'vintage-camera-collectors', description: 'Old glass, new stories.', membersCountBase: 3100, channelDescription: 'Talk restoration, camera history, and using classic gear.' }
]

export async function ensureDefaultCommunities() {
  for (const preset of DEFAULT_COMMUNITIES) {
    let community = await Community.findOne({ $or: [{ slug: preset.slug }, { name: preset.name }] })
    if (!community) {
      await Community.create({
        ...preset,
        channels: [{ name: 'General', slug: 'general', description: preset.channelDescription }],
        members: [],
        moderators: [],
        systemManaged: true
      })
      continue
    }

    let changed = false
    if (!community.slug) { community.slug = preset.slug; changed = true }
    if (!community.description) { community.description = preset.description; changed = true }
    if (!community.membersCountBase) { community.membersCountBase = preset.membersCountBase; changed = true }
    if (!community.channels?.length) {
      community.channels = [{ name: 'General', slug: 'general', description: preset.channelDescription }]
      changed = true
    }
    if (community.systemManaged !== true) { community.systemManaged = true; changed = true }
    if (changed) await community.save()
  }
}

export function publicCommunity(community, userId, requestStatus = 'none', canManageOverride = false) {
  const isMember = (community.members || []).some(member => String(member?._id || member) === String(userId))
  const isManager = Boolean(userId && (
    String(community.owner?._id || community.owner || '') === String(userId)
    || (community.moderators || []).some(moderator => String(moderator?._id || moderator) === String(userId))
  ))
  return {
    id: String(community._id),
    name: community.name,
    slug: community.slug,
    description: community.description || '',
    coverUrl: community.coverUrl || '',
    memberCount: (community.membersCountBase || 0) + (community.members || []).length,
    membershipStatus: isMember ? 'member' : requestStatus,
    canManage: isManager || canManageOverride,
    channels: (community.channels || []).map(channel => ({ id: String(channel._id), name: channel.name, slug: channel.slug, description: channel.description || '' }))
  }
}
