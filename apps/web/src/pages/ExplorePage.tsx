import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Film, Loader2 } from 'lucide-react'
import api from '../lib/api'

export default function ExplorePage() {
    const [media, setMedia] = useState<any[]>([])
    const [recentReviews, setRecentReviews] = useState<any[]>([])
    const [popularUsers, setPopularUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [type, setType] = useState('MOVIE')
    const [genre, setGenre] = useState('')
    const [year, setYear] = useState('')
    const [sort, setSort] = useState('ratingCount')

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        const fetchExploreData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (type) params.append('type', type);
                if (genre) params.append('genre', genre);
                if (year) params.append('year', year);
                if (sort === 'ratingCount' || sort === 'avgRating' || sort === 'releaseYear') {
                    params.append('sort', sort);
                    params.append('order', 'desc');
                }

                const [mediaRes, recentRes, usersRes] = await Promise.all([
                    api.get(`/media?${params.toString()}`).catch(() => ({ data: { data: [] } })),
                    api.get("/diary/explore/recent").catch(() => ({ data: { data: [] } })),
                    api.get("/users/popular").catch(() => ({ data: [] }))
                ]);

                setMedia(mediaRes?.data?.data || []);
                setRecentReviews(recentRes?.data?.data || []);
                setPopularUsers(usersRes?.data || []);
            } catch (err) {
                console.error("Failed to load explore data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExploreData();
    }, [type, genre, year, sort]);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await api.get(`/media/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data.data);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    return (
        <div style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '20px clamp(10px, 3vw, 20px)'
        }}>
            {/* FILTER BANNER */}
            <div style={{
                background: 'var(--color-bg-card)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 32,
                border: '1px solid var(--color-border)',
                borderBottomWidth: 3
            }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Browse By</span>

                    <select value={type} onChange={e => setType(e.target.value)} style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 10px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
                        <option value="MOVIE">Movies</option>
                        <option value="TV_SHOW">TV Shows</option>
                        <option value="">All Types</option>
                    </select>

                    <select value={genre} onChange={e => setGenre(e.target.value)} style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 10px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
                        <option value="">All Genres</option>
                        <option value="Action">Action</option>
                        <option value="Drama">Drama</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Horror">Horror</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Romance">Romance</option>
                    </select>

                    <select value={year} onChange={e => setYear(e.target.value)} style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 10px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
                        <option value="">Any Year</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2010">2010s</option>
                        <option value="2000">2000s</option>
                    </select>

                    <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 10px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
                        <option value="ratingCount">Most Popular</option>
                        <option value="avgRating">Highest Rated</option>
                        <option value="releaseYear">Newest Releases</option>
                        <option value="createdAt">Recently Added</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Find A Film</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value === '') {
                                setIsSearching(false);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                performSearch(searchQuery);
                            }
                        }}
                        style={{
                            background: 'var(--color-bg-dark)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            padding: '6px 12px',
                            outline: 'none',
                            fontSize: '0.8rem'
                        }}
                    />
                </div>
            </div>

            {loading && !media.length ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10vh' }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : isSearching ? (
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--color-text-muted)' }}>Search Results</h2>
                    <div className="stagger-children" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 16
                    }}>
                        {searchResults.map(m => (
                            <Link key={m._id || m.id} to={`/media/${m._id || m.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    aspectRatio: '2/3',
                                    background: 'var(--color-bg-elevated)',
                                    marginBottom: 8,
                                    border: '1px solid var(--color-border)',
                                    boxShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                                }}>
                                    {(m.posterUrl || m.thumbnailUrl) ? (
                                        <img src={m.posterUrl || m.thumbnailUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Film size={24} style={{ color: 'var(--color-text-muted)' }} />
                                        </div>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.title}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {/* Media Grid Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: 0 }}>
                                DISCOVER FILMS
                            </h3>
                        </div>
                        {media.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No media matches these filters.</div>
                        ) : (
                            <div className="stagger-children" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: 16
                            }}>
                                {media.map(m => (
                                    <Link key={m.id} to={`/media/${m.id}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            aspectRatio: '2/3',
                                            background: 'var(--color-bg-elevated)',
                                            marginBottom: 8,
                                            border: '1px solid var(--color-border)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            {m.posterUrl ? (
                                                <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Film size={24} style={{ color: 'var(--color-text-muted)' }} />
                                                </div>
                                            )}
                                            {m.avgRating > 0 && (
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '16px 8px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Star size={10} fill="#00E054" stroke="none" />
                                                    <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>{m.avgRating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.title}</h3>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>


                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                        {/* Users Section */}
                        {popularUsers.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: 0 }}>
                                        POPULAR REVIEWERS
                                    </h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {popularUsers.slice(0, 5).map(u => (
                                        <Link key={u.id} to={`/profile/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'inherit' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'var(--color-primary)' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.username}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u._count?.followers || 0} Followers</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Reviews Section */}
                        {recentReviews.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: 0 }}>
                                        RECENT REVIEWS
                                    </h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {recentReviews.slice(0, 5).map(r => (
                                        <div key={r.id} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                                            <Link to={`/media/${r.media.id}`} style={{ flexShrink: 0 }}>
                                                <div style={{ width: 50, height: 75, background: r.media.posterUrl ? `url(${r.media.posterUrl}) center/cover` : 'var(--color-bg-dark)', border: '1px solid var(--color-border)' }} />
                                            </Link>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <Link to={`/profile/${r.user.username}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none' }}>{r.user.username}</Link>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>watched</span>
                                                    <Link to={`/media/${r.media.id}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none' }}>{r.media.title}</Link>
                                                </div>
                                                <div style={{ display: 'flex', color: '#00E054', marginBottom: 6 }}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} size={10} fill={r.rating && i < r.rating ? "currentColor" : "none"} strokeWidth={r.rating && i < r.rating ? 0 : 1} stroke="currentColor" />
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {r.review}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
