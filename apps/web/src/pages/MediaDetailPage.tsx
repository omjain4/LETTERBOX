import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    Film, Tv, Music, PlayCircle, Star, Calendar, Plus, Heart,
    Loader2, Clock, List, ThumbsUp, ThumbsDown, Trash2, MessageSquare, Send
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

interface CommentData {
    id: string
    body: string
    likeCount: number
    dislikeCount: number
    userVote: 'LIKE' | 'DISLIKE' | null
    createdAt: string
    user: {
        id: string
        username: string
        displayName: string | null
        avatarUrl: string | null
    }
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
    const [comments, setComments] = useState<CommentData[]>([])
    const [commentBody, setCommentBody] = useState('')
    const [commentsPage, setCommentsPage] = useState(1)
    const [commentsTotalPages, setCommentsTotalPages] = useState(1)
    const [commentsTotal, setCommentsTotal] = useState(0)
    const [loadingComments, setLoadingComments] = useState(false)
    const [postingComment, setPostingComment] = useState(false)

    const fetchComments = (page: number, append = false) => {
        if (!id) return
        setLoadingComments(true)
        api.get(`/comments/media/${id}?page=${page}&limit=10`)
            .then(({ data }) => {
                setComments(prev => append ? [...prev, ...data.data] : data.data)
                setCommentsTotalPages(data.pagination.totalPages)
                setCommentsTotal(data.pagination.total)
                setCommentsPage(page)
            })
            .catch(() => { })
            .finally(() => setLoadingComments(false))
    }

    useEffect(() => {
        if (!id) return
        api.get(`/media/${id}`)
            .then(({ data }) => setMedia(data))
            .catch(() => navigate('/'))
            .finally(() => setLoading(false))
        // also fetch comments
        fetchComments(1)
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

                {/* ─── Discussion Section ─── */}
                <div style={{ marginTop: 48 }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
                        Discussion
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>({commentsTotal})</span>
                    </h2>

                    {/* Comment Input */}
                    {user ? (
                        <div style={{
                            display: 'flex', gap: 12, marginBottom: 32, alignItems: 'flex-start',
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                            }}>
                                {(user.displayName || user.username || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    value={commentBody}
                                    onChange={(e) => setCommentBody(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="input"
                                    style={{
                                        minHeight: 60, resize: 'vertical',
                                        border: '2px solid var(--color-border)',
                                        boxShadow: '3px 3px 0px var(--color-border)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!commentBody.trim() || postingComment}
                                        onClick={() => {
                                            if (!commentBody.trim()) return
                                            setPostingComment(true)
                                            api.post(`/comments/media/${id}`, { body: commentBody.trim() })
                                                .then(({ data }) => {
                                                    setComments(prev => [data, ...prev])
                                                    setCommentsTotal(prev => prev + 1)
                                                    setCommentBody('')
                                                })
                                                .catch(() => { })
                                                .finally(() => setPostingComment(false))
                                        }}
                                        style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                                    >
                                        <Send size={14} /> {postingComment ? 'Posting...' : 'Comment'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '20px', marginBottom: 24, textAlign: 'center',
                            border: '2px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            boxShadow: '3px 3px 0px var(--color-border)',
                        }}>
                            <Link to="/login" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Sign in</Link> to join the discussion
                        </div>
                    )}

                    {/* Comment List */}
                    {comments.length === 0 && !loadingComments && (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
                            No comments yet. Be the first to share your thoughts!
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {comments.map((c) => (
                            <div key={c.id} style={{
                                display: 'flex', gap: 12, padding: '16px',
                                background: 'var(--color-bg-card)',
                                border: '2px solid var(--color-border)',
                                boxShadow: '3px 3px 0px var(--color-border)',
                            }}>
                                <Link to={`/profile/${c.user.username}`} style={{ flexShrink: 0 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: 'var(--color-bg-dark)', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.8rem',
                                        overflow: 'hidden',
                                    }}>
                                        {c.user.avatarUrl
                                            ? <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : (c.user.displayName || c.user.username)[0].toUpperCase()}
                                    </div>
                                </Link>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <Link to={`/profile/${c.user.username}`} style={{
                                            fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)',
                                            textDecoration: 'none',
                                        }}>
                                            {c.user.displayName || c.user.username}
                                        </Link>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                                            {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {c.body}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button
                                            onClick={() => {
                                                if (!user) return
                                                api.post(`/comments/${c.id}/vote`, { voteType: 'LIKE' })
                                                    .then(({ data }) => {
                                                        setComments(prev => prev.map(cm => cm.id === c.id ? {
                                                            ...cm,
                                                            likeCount: cm.likeCount + (data.userVote === 'LIKE' ? 1 : -1) + (cm.userVote === 'DISLIKE' && data.userVote === 'LIKE' ? 0 : 0),
                                                            dislikeCount: cm.userVote === 'DISLIKE' ? cm.dislikeCount - 1 : cm.dislikeCount,
                                                            userVote: data.userVote,
                                                        } : cm))
                                                    })
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: user ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem',
                                                color: c.userVote === 'LIKE' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                fontWeight: c.userVote === 'LIKE' ? 700 : 500,
                                            }}
                                        >
                                            <ThumbsUp size={14} fill={c.userVote === 'LIKE' ? 'currentColor' : 'none'} /> {c.likeCount}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!user) return
                                                api.post(`/comments/${c.id}/vote`, { voteType: 'DISLIKE' })
                                                    .then(({ data }) => {
                                                        setComments(prev => prev.map(cm => cm.id === c.id ? {
                                                            ...cm,
                                                            dislikeCount: cm.dislikeCount + (data.userVote === 'DISLIKE' ? 1 : -1) + (cm.userVote === 'LIKE' && data.userVote === 'DISLIKE' ? 0 : 0),
                                                            likeCount: cm.userVote === 'LIKE' ? cm.likeCount - 1 : cm.likeCount,
                                                            userVote: data.userVote,
                                                        } : cm))
                                                    })
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: user ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem',
                                                color: c.userVote === 'DISLIKE' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                fontWeight: c.userVote === 'DISLIKE' ? 700 : 500,
                                            }}
                                        >
                                            <ThumbsDown size={14} fill={c.userVote === 'DISLIKE' ? 'currentColor' : 'none'} /> {c.dislikeCount}
                                        </button>
                                        {user && c.user.id === user.id && (
                                            <button
                                                onClick={() => {
                                                    api.delete(`/comments/${c.id}`)
                                                        .then(() => {
                                                            setComments(prev => prev.filter(cm => cm.id !== c.id))
                                                            setCommentsTotal(prev => prev - 1)
                                                        })
                                                }}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem',
                                                    color: 'var(--color-danger)', marginLeft: 'auto',
                                                }}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    {commentsPage < commentsTotalPages && (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => fetchComments(commentsPage + 1, true)}
                                disabled={loadingComments}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {loadingComments ? 'Loading...' : `Load More Comments`}
                            </button>
                        </div>
                    )}

                    {loadingComments && comments.length === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                            <Loader2 size={24} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}
                </div>
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
