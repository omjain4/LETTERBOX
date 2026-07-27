import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    Film, Tv, Music, PlayCircle, Star, Calendar, Plus, Heart,
    Loader2, Clock, List, Eye
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../stores/auth-context'
import LogMediaModal from '../components/LogMediaModal'

interface MediaDetail {
    id: string
    mediaType: string
    title: string
    description: string | null
    posterUrl: string | null
    backdropUrl: string | null
    releaseYear: number | null
    genres: string[]
    runtimeMinutes: number | null
    avgRating: number
    ratingCount: number
    metadata: Record<string, any> | null
    userEntry?: {
        id: string
        watchedDate: string
        rating: number | null
        liked: boolean
        review: string | null
    }
    _count: { diaryEntries: number; reviews: number; listItems: number }
}


const MEDIA_ICONS: Record<string, React.ElementType> = {
    MOVIE: Film, TV_SHOW: Tv, YOUTUBE_VIDEO: PlayCircle,
    YOUTUBE_STREAM: PlayCircle, SONG: Music, ALBUM: Music, SHORT_FILM: Film,
}

function formatRuntime(mins: number) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function StarRating({ rating }: { rating: number }) {
    return (
        <span style={{ color: 'var(--color-accent)', letterSpacing: 2, fontSize: '1.1rem' }}>
            {[1, 2, 3, 4, 5].map(i => {
                if (rating >= i) return <span key={i}>★</span>
                if (rating >= i - 0.5) return <span key={i} style={{ opacity: 0.6 }}>★</span>
                return <span key={i} style={{ color: 'var(--color-border)' }}>★</span>
            })}
            <span style={{ marginLeft: 8, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                {rating.toFixed(1)}
            </span>
        </span>
    )
}

export default function MediaDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [media, setMedia] = useState<MediaDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [showLog, setShowLog] = useState(false)
    const [reviews, setReviews] = useState<any[]>([])
    const [reviewsTotal, setReviewsTotal] = useState(0)
    const [reviewsPage, setReviewsPage] = useState(1)
    const [reviewsTotalPages, setReviewsTotalPages] = useState(1)
    const [loadingReviews, setLoadingReviews] = useState(false)

    const fetchReviews = (page: number, append = false) => {
        if (!id) return
        setLoadingReviews(true)
        api.get(`/media/${id}/reviews?page=${page}&limit=10`)
            .then(({ data }) => {
                setReviews(prev => append ? [...prev, ...data.data] : data.data)
                setReviewsTotalPages(data.pagination.totalPages)
                setReviewsTotal(data.pagination.total)
                setReviewsPage(page)
            })
            .catch(() => { })
            .finally(() => setLoadingReviews(false))
    }

    useEffect(() => {
        if (!id) return
        api.get(`/media/${id}`)
            .then(({ data }) => setMedia(data))
            .catch(() => navigate('/'))
            .finally(() => setLoading(false))
        fetchReviews(1)
    }, [id])

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!media) return null

    const Icon = MEDIA_ICONS[media.mediaType] ?? Film

    return (
        <div>
            {/* Backdrop */}
            <div style={{
                position: 'relative',
                height: 320,
                overflow: 'hidden',
                background: 'var(--color-bg-card)',
            }}>
                {media.backdropUrl ? (
                    <img
                        src={media.backdropUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, var(--color-primary-glow), transparent)',
                    }} />
                )}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, var(--color-bg) 20%, transparent 70%)',
                }} />
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1100, margin: '-120px auto 0', padding: '0 20px 60px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Left Column (Poster + Actions) */}
                    <div style={{ width: '100%', maxWidth: 220, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Poster */}
                        <div style={{
                            width: '100%',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            border: '3px solid var(--color-border)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            background: 'var(--color-bg-elevated)',
                            aspectRatio: '2/3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {media.posterUrl
                                ? <img src={media.posterUrl} alt={media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Icon size={48} style={{ color: 'var(--color-text-dim)' }} />
                            }
                        </div>

                        {/* Action Panel */}
                        <div style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                                <button
                                    onClick={() => user ? setShowLog(true) : window.location.assign('/login')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: media.userEntry ? '#00e054' : 'var(--color-text-muted)' }}
                                >
                                    <Eye size={22} color={media.userEntry ? '#00e054' : 'currentColor'} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Watch</span>
                                </button>
                                <button
                                    onClick={() => user ? setShowLog(true) : window.location.assign('/login')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: media.userEntry?.liked ? '#f43f5e' : 'var(--color-text-muted)' }}
                                >
                                    <Heart size={22} fill={media.userEntry?.liked ? '#f43f5e' : 'none'} color={media.userEntry?.liked ? '#f43f5e' : 'currentColor'} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Like</span>
                                </button>
                                <button
                                    onClick={() => user ? setShowLog(true) : window.location.assign('/login')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}
                                >
                                    <Clock size={22} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Watchlist</span>
                                </button>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, textAlign: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate</span>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => user ? setShowLog(true) : window.location.assign('/login')}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                                        >
                                            <Star
                                                size={18}
                                                fill={(media.userEntry?.rating ?? 0) >= star ? '#4ade80' : 'none'}
                                                color={(media.userEntry?.rating ?? 0) >= star ? '#4ade80' : 'var(--color-text-dim)'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => user ? setShowLog(true) : window.location.assign('/login')}
                                className="btn btn-primary glow"
                                style={{
                                    width: '100%', fontSize: '0.85rem', padding: '10px 0',
                                    marginTop: 4, fontWeight: 700
                                }}
                            >
                                {media.userEntry ? 'Edit log or review' : 'Review or log...'}
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <span className={`badge badge-${media.mediaType.toLowerCase()}`} style={{ marginBottom: 10 }}>
                            <Icon size={12} /> {media.mediaType.replace(/_/g, ' ')}
                        </span>
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                            fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8,
                        }}>
                            {media.title}
                            {media.releaseYear && (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 400, marginLeft: 10 }}>
                                    ({media.releaseYear})
                                </span>
                            )}
                        </h1>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                            {media.avgRating > 0 && <StarRating rating={media.avgRating} />}
                            {media.runtimeMinutes && (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={14} /> {formatRuntime(media.runtimeMinutes)}
                                </span>
                            )}
                        </div>

                        {media.genres.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                                {media.genres.map(g => (
                                    <span key={g} style={{
                                        padding: '4px 10px',
                                        borderRadius: 20,
                                        fontSize: '0.75rem',
                                        background: 'var(--color-bg-elevated)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-muted)',
                                    }}>{g}</span>
                                ))}
                            </div>
                        )}

                    </div>
                </div>

                {/* User Logged Banner */}
                {media.userEntry && (
                    <div style={{
                        marginTop: 24, padding: '16px 20px',
                        background: 'var(--color-bg-card)',
                        border: '2px solid var(--color-border)',
                        borderLeft: '4px solid var(--color-primary)',
                        boxShadow: '3px 3px 0px var(--color-border)',
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ background: 'var(--color-primary)', padding: '4px 10px', fontWeight: 800, fontSize: '0.7rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ✓ Logged
                            </div>
                            {media.userEntry.review && (
                                <div style={{ background: '#059669', padding: '4px 10px', fontWeight: 800, fontSize: '0.7rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ✓ Reviewed
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, fontSize: '0.9rem' }}>
                            <strong>on {new Date(media.userEntry.watchedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                            {media.userEntry.rating && <span style={{ marginLeft: 12, color: '#fbbf24', fontWeight: 700 }}>★ {media.userEntry.rating}</span>}
                        </div>
                        {media.userEntry.liked && <Heart fill="#f43f5e" color="#f43f5e" size={16} />}
                    </div>
                )}

                {/* Stats Bar */}
                <div style={{
                    display: 'flex', gap: 24, flexWrap: 'wrap',
                    marginTop: 32, padding: '20px 24px',
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                }}>
                    {[
                        { icon: Calendar, label: 'Logged', value: media._count.diaryEntries },
                        { icon: Star, label: 'Reviews', value: reviewsTotal },
                        { icon: List, label: 'In Lists', value: media._count.listItems },
                    ].map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <s.icon size={18} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Description */}
                {media.description && (
                    <div style={{ marginTop: 32 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Overview</h2>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '0.95rem', maxWidth: 720 }}>
                            {media.description}
                        </p>
                    </div>
                )}

                {/* Metadata Panel */}
                {media.metadata && Object.keys(media.metadata).length > 0 && (
                    <div style={{ marginTop: 32, maxWidth: 720 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Details</h2>
                        <div style={{
                            background: 'var(--color-bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden',
                        }}>
                            {Object.entries(media.metadata).filter(([k]) => !['type', 'id', 'mediaId'].includes(k)).map(([key, val], i) => (
                                <div key={key} style={{
                                    display: 'flex',
                                    padding: '12px 20px',
                                    borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                                    gap: 16,
                                }}>
                                    <span style={{
                                        minWidth: 130, fontSize: '0.8rem', fontWeight: 600,
                                        color: 'var(--color-text-muted)', textTransform: 'capitalize',
                                        letterSpacing: '0.03em',
                                    }}>
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                        {Array.isArray(val) ? val.join(', ') : String(val ?? '—')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Reviews Section ─── */}
                <div style={{ marginTop: 48 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Star size={20} style={{ color: 'var(--color-primary)' }} />
                            Reviews
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>({reviewsTotal})</span>
                        </h2>
                    </div>

                    {/* Review List */}
                    {reviews.length === 0 && !loadingReviews && (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
                            No reviews yet.
                            {!user && <><br /><Link to="/login" style={{ color: 'var(--color-primary)' }}>Sign in</Link> to be the first to log a review!</>}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {reviews.map((r) => (
                            <div key={r.id} style={{
                                display: 'flex', gap: 12, padding: '16px',
                                background: 'var(--color-bg-card)',
                                border: '2px solid var(--color-border)',
                                boxShadow: '3px 3px 0px var(--color-border)',
                            }}>
                                <Link to={`/profile/${r.user.username}`} style={{ flexShrink: 0 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: 'var(--color-bg-dark)', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.8rem',
                                        overflow: 'hidden',
                                    }}>
                                        {r.user.avatarUrl
                                            ? <img src={r.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : (r.user.displayName || r.user.username)[0].toUpperCase()}
                                    </div>
                                </Link>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <Link to={`/profile/${r.user.username}`} style={{
                                            fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)',
                                            textDecoration: 'none',
                                        }}>
                                            {r.user.displayName || r.user.username}
                                        </Link>
                                        {r.rating > 0 && (
                                            <div style={{ display: 'flex', color: '#00e054', gap: 2 }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={12} fill={i < r.rating ? 'currentColor' : 'none'} strokeWidth={i < r.rating ? 0 : 1.5} />
                                                ))}
                                            </div>
                                        )}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                                            {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {r.review}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {r.liked && <Heart size={14} fill="#f43f5e" color="#f43f5e" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    {reviewsPage < reviewsTotalPages && (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => fetchReviews(reviewsPage + 1, true)}
                                disabled={loadingReviews}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {loadingReviews ? 'Loading...' : `Load More Reviews`}
                            </button>
                        </div>
                    )}

                    {loadingReviews && reviews.length === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                            <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                        </div>
                    )}
                </div>
            </div>

            {showLog && media && (
                <LogMediaModal
                    media={{ id: media.id, title: media.title, mediaType: media.mediaType, posterUrl: media.posterUrl }}
                    onClose={() => setShowLog(false)}
                    onSuccess={() => {
                        setShowLog(false)
                        api.get(`/media/${id}`).then(({ data }) => setMedia(data))
                        fetchReviews(1)
                    }}
                />
            )}
        </div>
    )
}
