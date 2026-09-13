import { useState } from 'react';

export default function GifPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('reaction');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'GIF search failed.');
      setGifs(data.gifs || []);
    } catch (err) {
      setError(err.message);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  function choose(gif) {
    onChange(gif.url);
    setOpen(false);
  }

  return (
    <div className="gif-picker-wrap">
      <button type="button" onClick={() => { setOpen(!open); if (!open && gifs.length === 0) search(); }}>
        [ Add GIF ]
      </button>
      {value && <button type="button" onClick={() => onChange('')}>[ Remove GIF ]</button>}
      {value && <div className="gif-selected"><img src={value} alt="Selected GIF" /></div>}
      {open && (
        <div className="gif-picker" role="dialog" aria-label="GIF picker">
          <div className="gif-picker-head"><b>GIF SEARCH</b> <a href="#" onClick={(e) => { e.preventDefault(); setOpen(false); }}>[close]</a></div>
          <form onSubmit={search} className="gif-search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search GIFs" maxLength={80} />
            <button type="submit">Search</button>
          </form>
          {loading && <div className="muted">Searching...</div>}
          {error && <div className="error">{error}</div>}
          <div className="gif-grid">
            {gifs.map((gif) => (
              <button type="button" className="gif-item" key={gif.id} onClick={() => choose(gif)} title={gif.title}>
                <img src={gif.preview} alt={gif.title} loading="lazy" />
              </button>
            ))}
          </div>
          <div className="muted gif-note">GIFs are supplied through the configured provider and are subject to its content rating.</div>
        </div>
      )}
    </div>
  );
}
