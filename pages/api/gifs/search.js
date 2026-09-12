import { searchGifs, getGifsByCategory } from '../../../lib/gifLibrary';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, category } = req.query;
    const searchQuery = query || '';

    let results;
    if (category) {
      results = getGifsByCategory(category);
    } else {
      results = searchGifs(searchQuery);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error searching GIFs:', error);
    return res.status(500).json({ message: 'Error searching GIFs' });
  }
}
