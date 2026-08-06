import { useState } from 'react'
import { X, Star, Calendar, Tag, Heart, Loader2, Eye, Clock } from 'lucide-react'
import api from '../lib/api'

interface Props {
    media: { id: string; title: string; mediaType: string; posterUrl: string | null }
    onClose: () => void
    onSuccess: () => void
    initialEntry?: { rating?: number; review?: string; liked?: boolean; tags?: string[] } | null
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0)
    const display = hover || value
    return (
        <div style={{ display: 'flex', gap: 4, cursor: 'pointer' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(value === i ? 0 : i)}
                    style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                >
                    <span style={{ color: i <= display ? 'var(--color-accent)' : 'var(--color-border)' }}>★</span>
                </button>
            ))}
            {value > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: 6 }}>
                    {value}/5
                </span>
            )}
        </div>
    )
}

export default function LogMediaModal({ media, onClose, onSuccess, initialEntry }: Props) {
    const today = new Date().toISOString().split('T')[0]
    const [date, setDate] = useState(today)
    const [rating, setRating] = useState(initialEntry?.rating || 0)
    const [review, setReview] = useState(initialEntry?.review || '')
    const [tags, setTags] = useState((initialEntry?.tags || []).filter(t => t !== 'Watchlist').join(', '))
    const [liked, setLiked] = useState(initialEntry?.liked || false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isWatched, setIsWatched] = useState(initialEntry ? !initialEntry.tags?.includes('Watchlist') : true)
    const [inWatchlist, setInWatchlist] = useState(initialEntry?.tags?.includes('Watchlist') || false)
    const alreadyReviewed = !!(initialEntry?.review)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const allTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
            if (inWatchlist) allTags.push('Watchlist')

            await api.post('/diary', {
                mediaId: media.id,
                watchedDate: date,
                rating: rating || undefined,
                review: review || undefined,
                tags: allTags,
                liked,
            })
            onSuccess()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to log media')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className="card animate-fade-in" style={{
                width: '100%', maxWidth: 480, padding: 32,
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Log to Diary</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{media.title}</p>
                        {alreadyReviewed && (
                            <span style={{
                                display: 'inline-block', marginTop: 6,
                                background: 'rgba(239,68,68,0.15)', color: '#f87171',
                                fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>Already Reviewed</span>
                        )}
                    </div>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Watched / Watchlist Toggle */}
                <div style={{
                    display: 'flex', gap: 0, marginBottom: 20,
                    border: '2px solid var(--color-border)',
                }}>
                    <button
                        type="button"
                        onClick={() => { setIsWatched(true); setInWatchlist(false) }}
                        style={{
                            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            background: isWatched ? 'var(--color-primary)' : 'transparent',
                            color: isWatched ? '#fff' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Eye size={14} /> Watched
                    </button>
                    <button
                        type="button"
                        onClick={() => { setInWatchlist(true); setIsWatched(false) }}
                        style={{
                            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            background: inWatchlist ? '#6366f1' : 'transparent',
                            color: inWatchlist ? '#fff' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Clock size={14} /> Watchlist
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.85rem',
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Date */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Calendar size={14} /> {inWatchlist ? 'Date Added' : 'Date Watched'}
                        </label>
                        <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required
                            style={{ colorScheme: 'dark' }} />
                    </div>

                    {/* Rating (only shows for watched) */}
                    {!inWatchlist && (
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Star size={14} /> Rating
                            </label>
                            <StarPicker value={rating} onChange={setRating} />
                        </div>
                    )}

                    {/* Liked */}
                    {!inWatchlist && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                type="button"
                                onClick={() => setLiked(!liked)}
                                className="btn btn-ghost"
                                style={{ padding: 8, color: liked ? '#f43f5e' : 'var(--color-text-dim)' }}
                            >
                                <Heart size={20} fill={liked ? '#f43f5e' : 'none'} />
                            </button>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {liked ? 'You liked this!' : 'Mark as liked'}
                            </span>
                        </div>
                    )}

                    {/* Review (only shows for watched) */}
                    {!inWatchlist && (
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Review <span style={{ fontWeight: 400 }}>(optional)</span>
                            </label>
                            <textarea
                                className="input"
                                placeholder="What did you think? Share your thoughts..."
                                value={review}
                                onChange={e => setReview(e.target.value)}
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    )}

                    {/* Tags */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Tag size={14} /> Tags <span style={{ fontWeight: 400 }}>(comma separated)</span>
                        </label>
                        <input
                            className="input"
                            placeholder="e.g. sci-fi, favourite, rewatch"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary glow"
                        disabled={loading}
                        style={{ width: '100%', padding: '12px' }}
                    >
                        {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : inWatchlist ? 'Add to Watchlist' : 'Save to Diary'}
                    </button>
                </form>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    )
}
