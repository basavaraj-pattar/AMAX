export const communityCatalog = [
  { name: 'Independent Filmmakers', slug: 'independent-filmmakers', members: '12.4k', description: 'A home for the brave, scrappy, and self-funded.' },
  { name: 'Screenwriters Room', slug: 'screenwriters-room', members: '8.7k', description: 'Pages, premises, and the messy middle.' },
  { name: 'Cinematographers', slug: 'cinematographers', members: '5.2k', description: 'Light chasers and lens obsessives.' },
  { name: 'Vintage Camera Collectors', slug: 'vintage-camera-collectors', members: '3.1k', description: 'Old glass, new stories.' }
]

const joinedCommunitiesStorageKey = 'a-max-joined-communities'

export function readJoinedCommunities() {
  try {
    const stored = JSON.parse(localStorage.getItem(joinedCommunitiesStorageKey) || '[]')
    if (!Array.isArray(stored)) return []
    return stored.map(value => {
      if (typeof value === 'string') return communityCatalog.find(community => community.name === value || community.slug === value)
      if (value && typeof value === 'object') return communityCatalog.find(community => community.name === value.name || community.slug === value.slug)
      return null
    }).filter(Boolean)
  } catch {
    return []
  }
}

export function saveJoinedCommunities(communities) {
  const names = [...new Set(communities.map(community => typeof community === 'string' ? community : community.name))]
  localStorage.setItem(joinedCommunitiesStorageKey, JSON.stringify(names))
  window.dispatchEvent(new Event('amax:joined-communities-updated'))
}
