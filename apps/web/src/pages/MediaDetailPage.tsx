import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    Film, Tv, Music, PlayCircle, Star, Calendar, Plus, Heart,
    Loader2, Clock, List
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

    useEffect(() => {
        if (!id) return
        api.get(`/media/${id}`)
            .then(({ data }) => setMedia(data))
            .catch(() => navigate('/'))
            .finally(() => setLoading(false))
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
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Poster */}
                    <div style={{
                        width: 180, flexShrink: 0,
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

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {user && (!media.userEntry || !media.userEntry.review) && (
                                <button
                                    onClick={() => setShowLog(true)}
                                    className="btn btn-primary glow"
                                    style={{ fontSize: '0.9rem', padding: '10px 22px' }}
                                >
                                    <Plus size={16} /> {media.userEntry ? 'Edit Log / Review' : 'Log / Review'}
                                </button>
                            )}
                            {!user && (
                                <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '10px 22px' }}>
                                    <Star size={16} /> Sign in to log
                                </Link>
                            )}
                        </div>
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
                        { icon: Star, label: 'Reviews', value: media._count.reviews },
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
            </div>

            {showLog && media && (
                <LogMediaModal
                    media={{ id: media.id, title: media.title, mediaType: media.mediaType, posterUrl: media.posterUrl }}
                    onClose={() => setShowLog(false)}
                    onSuccess={() => setShowLog(false)}
                />
            )}
        </div>
    )
}
