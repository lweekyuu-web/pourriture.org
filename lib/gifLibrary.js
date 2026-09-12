// GIF Library Integration
// Uses a simple local GIF database or integrates with Giphy/Tenor
// For now, uses a curated local list

const LOCAL_GIFS = {
  funny: [
    { id: 'cat_bounce', title: 'Bouncing Cat', url: '/gifs/cat-bounce.gif', category: 'Funny' },
    { id: 'dog_jump', title: 'Jumping Dog', url: '/gifs/dog-jump.gif', category: 'Funny' },
    { id: 'fail_comp', title: 'Funny Fail', url: '/gifs/fail-comp.gif', category: 'Funny' },
  ],
  reaction: [
    { id: 'thumbs_up', title: 'Thumbs Up', url: '/gifs/thumbs-up.gif', category: 'Reaction' },
    { id: 'facepalm', title: 'Facepalm', url: '/gifs/facepalm.gif', category: 'Reaction' },
    { id: 'eye_roll', title: 'Eye Roll', url: '/gifs/eye-roll.gif', category: 'Reaction' },
  ],
  animals: [
    { id: 'cat_nap', title: 'Sleeping Cat', url: '/gifs/cat-nap.gif', category: 'Animals' },
    { id: 'dog_spin', title: 'Spinning Dog', url: '/gifs/dog-spin.gif', category: 'Animals' },
    { id: 'bird_dance', title: 'Dancing Bird', url: '/gifs/bird-dance.gif', category: 'Animals' },
  ],
  retro: [
    { id: 'matrix_rain', title: 'Matrix Rain', url: '/gifs/matrix-rain.gif', category: 'Retro' },
    { id: 'scanner', title: 'Scanner Line', url: '/gifs/scanner.gif', category: 'Retro' },
    { id: 'vhs', title: 'VHS Glitch', url: '/gifs/vhs-glitch.gif', category: 'Retro' },
  ],
};

/**
 * Search GIFs by query
 * @param {String} query - Search term
 * @param {String} category - Optional category filter
 * @returns {Array} Matching GIFs
 */
function searchGifs(query = '', category = null) {
  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const cat of Object.values(LOCAL_GIFS)) {
    for (const gif of cat) {
      if (category && gif.category !== category) continue;
      if (gif.title.toLowerCase().includes(lowerQuery) || gif.id.includes(lowerQuery)) {
        results.push(gif);
      }
    }
  }

  return results;
}

/**
 * Get GIF by ID
 * @param {String} gifId - GIF ID
 * @returns {Object|null} GIF object or null
 */
function getGifById(gifId) {
  for (const cat of Object.values(LOCAL_GIFS)) {
    const gif = cat.find((g) => g.id === gifId);
    if (gif) return gif;
  }
  return null;
}

/**
 * Get all categories
 * @returns {Array} Category names
 */
function getCategories() {
  return Object.keys(LOCAL_GIFS);
}

/**
 * Get GIFs by category
 * @param {String} category - Category name
 * @returns {Array} GIFs in category
 */
function getGifsByCategory(category) {
  return LOCAL_GIFS[category] || [];
}

/**
 * Check if GIF is in blacklist (admin-configurable)
 * @param {String} gifId - GIF ID
 * @param {Array} blacklist - Array of blacklisted GIF IDs
 * @returns {Boolean}
 */
function isGifBlacklisted(gifId, blacklist = []) {
  return blacklist.includes(gifId);
}

module.exports = {
  searchGifs,
  getGifById,
  getCategories,
  getGifsByCategory,
  isGifBlacklisted,
  LOCAL_GIFS,
};
