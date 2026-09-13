const GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs/search';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(200).json({ gifs: [] });
  if (!process.env.GIPHY_API_KEY) {
    return res.status(503).json({ error: 'GIF search is not configured yet.' });
  }

  try {
    const url = new URL(GIPHY_ENDPOINT);
    url.searchParams.set('api_key', process.env.GIPHY_API_KEY);
    url.searchParams.set('q', q.slice(0, 80));
    url.searchParams.set('limit', '18');
    url.searchParams.set('rating', 'pg-13');
    url.searchParams.set('lang', 'en');

    const response = await fetch(url.toString());
    if (!response.ok) return res.status(502).json({ error: 'GIF provider unavailable.' });
    const data = await response.json();
    const gifs = (data.data || []).map((item) => ({
      id: item.id,
      title: item.title || 'GIF',
      preview: item.images?.fixed_width_small?.webp || item.images?.fixed_width_small?.url,
      url: item.images?.original?.url,
    })).filter((gif) => gif.preview && gif.url);
    return res.status(200).json({ gifs });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to search GIFs.' });
  }
}
