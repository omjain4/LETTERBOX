import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Film, Tv, Music, PlayCircle, Lock, Globe, Loader2, Trash2, List } from 'lucide-react'

import api from '../lib/api'
import { useAuth } from '../stores/auth-context'

interface ListDetail {
    id: string
    name: string
    description: string | null
    isPublic: boolean
    isRanked: boolean
    user: { id: string; username: string; avatarUrl: string | null }
    items: {
        id: string
        position: number
        notes: string | null
        media: {
            id: string
            title: string
            mediaType: string
            posterUrl: string | null
            releaseYear: number | null
            avgRating: number
        }
    }[]
}

const TYPE_ICON: Record<string, React.ElementType> = {
    MOVIE: Film, TV_SHOW: Tv, YOUTUBE_VIDEO: PlayCircle,
    YOUTUBE_STREAM: PlayCircle, SONG: Music, ALBUM: Music, SHORT_FILM: Film,
}

export default function ListDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const [list, setList] = useState<ListDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        api.get(`/lists/${id}`)
            .then(({ data }) => setList(data))
            .catch(() => setList(null))
            .finally(() => setLoading(false))
    }, [id])

    const removeItem = async (itemId: string) => {
        if (!id) return
        await api.delete(`/lists/${id}/items/${itemId}`)
        setList(l => l ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l)
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={28} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!list) return (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>
            <List size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>List not found or is private.</p>
            <Link to="/lists" className="btn btn-outline" style={{ marginTop: 20, display: 'inline-flex' }}>Back to Lists</Link>
        </div>
    )

    const isOwner = user?.id === list.user.id

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
            {/* Header */}
            <div className="animate-fade-in" style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {list.isPublic ? <Globe size={14} style={{ color: 'var(--color-text-dim)' }} /> : <Lock size={14} style={{ color: 'var(--color-text-dim)' }} />}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                        {list.isPublic ? 'Public' : 'Private'} list by{' '}
                        <Link to={`/profile/${list.user.username}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            {list.user.username}
                        </Link>
                    </span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>{list.name}</h1>
                {list.description && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 600 }}>{list.description}</p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                    </span>
                    {list.isRanked && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(99,102,241,0.3)' }}>
                            Ranked
                        </span>
                    )}
                </div>
            </div>

            {/* Items */}
            {list.items.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <List size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>This list has no items yet.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Search for media and add it to this list.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="animate-fade-in">
                    {list.items.sort((a, b) => a.position - b.position).map((item, idx) => {
                        const Icon = TYPE_ICON[item.media.mediaType] ?? Film
                        return (
                            <div key={item.id} className="card glass-hover" style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                            }}>
                                {/* Rank */}
                                {list.isRanked && (
                                    <span style={{ minWidth: 28, fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-dim)', textAlign: 'right' }}>
                                        {idx + 1}
                                    </span>
                                )}

                                {/* Poster */}
                                <Link to={`/media/${item.media.id}`}>
                                    <div style={{
                                        width: 44, height: 64, borderRadius: 6,
                                        overflow: 'hidden', background: 'var(--color-bg-elevated)', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {item.media.posterUrl
                                            ? <img src={item.media.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <Icon size={18} style={{ color: 'var(--color-text-dim)' }} />
                                        }
                                    </div>
                                </Link>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Link to={`/media/${item.media.id}`} style={{ textDecoration: 'none' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                            {item.media.title}
                                        </span>
                                        {item.media.releaseYear && (
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                                                ({item.media.releaseYear})
                                            </span>
                                        )}
                                    </Link>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 3, alignItems: 'center' }}>
                                        <span className={`badge badge-${item.media.mediaType.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                            {item.media.mediaType.replace(/_/g, ' ')}
                                        </span>
                                        {item.media.avgRating > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                                                ★ {item.media.avgRating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    {item.notes && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{item.notes}</p>
                                    )}
                                </div>

                                {isOwner && (
                                    <button onClick={() => removeItem(item.id)} className="btn btn-ghost" style={{ padding: 6, color: 'var(--color-text-dim)', flexShrink: 0 }}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
