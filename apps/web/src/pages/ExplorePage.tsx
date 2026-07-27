import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Heart, TrendingUp, Filter } from 'lucide-react'
import api from '../lib/api'

// We will fetch popular media (already exists in HomePage)
// We will fetch recent reviews
// We will fetch popular reviews
// We will fetch popular users

export default function ExplorePage() {
    const [popularMedia, setPopularMedia] = useState<any[]>([])
    const [recentReviews, setRecentReviews] = useState<any[]>([])
    const [popularReviews, setPopularReviews] = useState<any[]>([])
    const [popularUsers, setPopularUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchExploreData = async () => {
            try {
                const [mediaRes, recentRes, popReviewsRes, usersRes] = await Promise.all([
                    api.get("/media/popular"),
                    api.get("/diary/explore/recent"),
                    api.get("/diary/explore/popular"),
                    api.get("/users/popular")
                ]);
                setPopularMedia(mediaRes.data.data);
                setRecentReviews(recentRes.data.data);
                setPopularReviews(popReviewsRes.data.data);
                setPopularUsers(usersRes.data);
            } catch (err) {
                console.error("Failed to load explore data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExploreData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10vh' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Loading explore...</span>
            </div>
        )
    }

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
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Browse By</span>
                    {['YEAR', 'RATING', 'POPULAR', 'GENRE', 'SERVICE'].map(filter => (
                        <button key={filter} style={{
                            background: 'none', border: 'none', color: 'var(--color-text)',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}>
                            {filter} <Filter size={12} />
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Find A Film</span>
                    <input type="text" style={{
                        background: 'var(--color-bg-dark)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        padding: '6px 12px',
                        outline: 'none',
                        fontSize: '0.8rem'
                    }} />
                </div>
            </div>

            {/* POPULAR FILMS THIS WEEK */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                    <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Popular Films This Week
                    </h2>
                    <Link to="/search" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'none' }}>MORE</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {popularMedia.slice(0, 4).map(media => (
                        <Link to={`/media/${media.id}`} key={media.id} style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '100%',
                                aspectRatio: '2/3',
                                background: 'var(--color-bg-card)',
                                border: '2px solid var(--color-border)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {media.posterUrl ? (
                                    <img src={media.posterUrl} alt={media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 8, textAlign: 'center', color: 'var(--color-text-dim)' }}>
                                        {media.title}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00e054', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <TrendingUp size={12} /> {media.ratingCount}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f9d976', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <Star size={12} fill="currentColor" /> {(media.avgRating || 0).toFixed(1)}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* AD BANNER */}
            <div style={{
                background: 'linear-gradient(to right, #111, #222, #111)',
                border: '1px solid var(--color-border)',
                borderBottomWidth: 4,
                padding: '24px',
                textAlign: 'center',
                marginBottom: 40,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <h2 style={{ color: '#f9d976', fontSize: '2rem', fontWeight: 900, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
                    AD-FREE. QUESTION. AMAZE. AMAZE. AMAZE.
                </h2>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>
                    Get annual and all-time stats, filtering by your favorite services, watchlist notifications and more...
                </p>
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }}>
                    <span style={{ background: '#f43f5e', color: 'white', padding: '6px 12px', fontWeight: 800, fontSize: '0.9rem', border: '2px solid white', boxShadow: '2px 2px 0px white' }}>
                        UPGRADE TO PRO
                    </span>
                </div>
            </div>

            {/* JUST REVIEWED... */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                    <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Just Reviewed...
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
                    {recentReviews.map(r => (
                        <Link to={`/media/${r.media.id}`} key={r.id} style={{ flexShrink: 0 }}>
                            <div style={{
                                width: 70,
                                aspectRatio: '2/3',
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                overflow: 'hidden'
                            }}>
                                {r.media.posterUrl ? (
                                    <img src={r.media.posterUrl} alt={r.media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ fontSize: '0.5rem', padding: 4, color: 'var(--color-text-dim)', wordBreak: 'break-all' }}>{r.media.title}</div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* BOTTOM TWO COLUMNS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 32 }}>

                {/* POPULAR REVIEWS */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            Popular Reviews This Week
                        </h2>
                        <Link to="/" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'none' }}>MORE</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {popularReviews.map(r => (
                            <div key={r.id} style={{ display: 'flex', gap: 16 }}>
                                <Link to={`/media/${r.media.id}`} style={{ flexShrink: 0 }}>
                                    <div style={{
                                        width: 100,
                                        aspectRatio: '2/3',
                                        background: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border)',
                                        overflow: 'hidden'
                                    }}>
                                        {r.media.posterUrl && <img src={r.media.posterUrl} alt={r.media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                </Link>
                                <div style={{ flex: 1, minWidth: 0, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <Link to={`/media/${r.media.id}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                                            {r.media.title}
                                        </Link>
                                        {r.media.releaseYear && <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{r.media.releaseYear}</span>}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <Link to={`/profile/${r.user.username}`} style={{
                                            fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)',
                                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
                                                {r.user.avatarUrl && <img src={r.user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            </div>
                                            {r.user.username}
                                        </Link>
                                        {r.rating > 0 && (
                                            <div style={{ display: 'flex', color: '#00e054', gap: 2 }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={12} fill={i < r.rating ? 'currentColor' : 'none'} strokeWidth={i < r.rating ? 0 : 1.5} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text)', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {r.review}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-dim)' }}>
                                        <Heart size={14} fill={r.likedByMe ? '#f43f5e' : 'none'} color={r.likedByMe ? '#f43f5e' : 'currentColor'} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Like review • {r.likeCount} likes</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SIDEBAR */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 16 }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            POPULAR REVIEWERS
                        </h2>
                        <Link to="/" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'none' }}>MORE</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {popularUsers.map(user => (
                            <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
                                        {user.avatarUrl && <img src={user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div>
                                        <Link to={`/profile/${user.username}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', textDecoration: 'none', display: 'block' }}>
                                            {user.username}
                                        </Link>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                                            {user.reviewCount} films, {user.followerCount} followers
                                        </span>
                                    </div>
                                </div>
                                <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                    +
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
