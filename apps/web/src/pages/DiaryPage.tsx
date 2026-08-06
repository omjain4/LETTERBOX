import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Film, Heart, ChevronLeft, ChevronRight, Loader2, Clock, Eye } from 'lucide-react'
import api from '../lib/api'

interface DiaryEntry {
    id: string
    watchedDate: string
    rating: number | null
    review: string | null
    tags: string[]
    liked: boolean
    mediaId: string
    media: { id: string; title: string; mediaType: string; posterUrl: string | null; releaseYear: number | null }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DiaryPage() {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [entries, setEntries] = useState<DiaryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'watched' | 'watchlist'>('watched')

    useEffect(() => {
        setLoading(true)
        api.get('/diary', { params: { month, year, limit: 50 } })
            .then(({ data }) => setEntries(data.data))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false))
    }, [month, year])

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    // Deduplicate by mediaId (keep latest)
    const deduped = Object.values(
        entries.reduce<Record<string, DiaryEntry>>((acc, e) => {
            const mid = e.mediaId || e.media?.id
            if (!acc[mid]) acc[mid] = e
            return acc
        }, {})
    )

    // Split into WATCHED vs WATCHLIST
    const watchedEntries = deduped.filter(e => !e.tags?.includes('Watchlist'))
    const watchlistEntries = deduped.filter(e => e.tags?.includes('Watchlist'))
    const displayEntries = activeTab === 'watched' ? watchedEntries : watchlistEntries

    // Group by day
    const byDay: Record<string, DiaryEntry[]> = {}
    displayEntries.forEach(e => {
        const day = new Date(e.watchedDate).toISOString().split('T')[0]
        if (!byDay[day]) byDay[day] = []
        byDay[day].push(e)
    })
    const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a))

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
            {/* Header */}
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        Your <span className="gradient-text">Diary</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                        {displayEntries.length} entr{displayEntries.length !== 1 ? 'ies' : 'y'} this month
                    </p>
                </div>

                {/* Month Selector */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: '8px 16px',
                }}>
                    <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: 6 }}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: 100, textAlign: 'center' }}>
                        {MONTHS[month - 1]} {year}
                    </span>
                    <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: 6 }}
                        disabled={year === now.getFullYear() && month === now.getMonth() + 1}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* WATCHED / WATCHLIST Tabs */}
            <div style={{
                display: 'flex', gap: 0, marginBottom: 28,
                border: '2px solid var(--color-border)',
                background: 'var(--color-bg-card)',
            }}>
                {(['watched', 'watchlist'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: '12px 0',
                            border: 'none', cursor: 'pointer',
                            fontWeight: 800, fontSize: '0.8rem',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === tab ? '#fff' : 'var(--color-text-muted)',
                            transition: 'all 0.15s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        {tab === 'watched' ? <Eye size={14} /> : <Clock size={14} />}
                        {tab}
                        <span style={{
                            background: activeTab === tab ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-elevated)',
                            padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem',
                        }}>
                            {tab === 'watched' ? watchedEntries.length : watchlistEntries.length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={28} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : sortedDays.length === 0 ? (
                <div className="card" style={{
                    padding: 60, textAlign: 'center', color: 'var(--color-text-muted)',
                }}>
                    {activeTab === 'watched' ? (
                        <Eye size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    ) : (
                        <Clock size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    )}
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {activeTab === 'watched' ? 'No entries this month' : 'Your watchlist is empty'}
                    </p>
                    <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                        {activeTab === 'watched'
                            ? 'Search for media and log it to your diary.'
                            : 'Add media to your watchlist from search or media pages.'}
                    </p>
                    <Link to="/search" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                        Find something to {activeTab === 'watched' ? 'watch' : 'add'}
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="animate-fade-in">
                    {sortedDays.map(day => {
                        const date = new Date(day + 'T00:00:00')
                        return (
                            <div key={day}>
                                {/* Day Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14,
                                }}>
                                    <div style={{ textAlign: 'center', minWidth: 48 }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-primary)' }}>
                                            {date.getDate()}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                                </div>

                                {/* Entries */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 64 }}>
                                    {byDay[day].map(entry => (
                                        <div key={entry.id} className="card glass-hover" style={{
                                            display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start',
                                        }}>
                                            <Link to={`/media/${entry.media.id}`} style={{ flexShrink: 0 }}>
                                                <div style={{
                                                    width: 48, height: 72, borderRadius: 6,
                                                    overflow: 'hidden', background: 'var(--color-bg-elevated)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {entry.media.posterUrl
                                                        ? <img src={entry.media.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : <Film size={20} style={{ color: 'var(--color-text-dim)' }} />
                                                    }
                                                </div>
                                            </Link>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                                    <Link to={`/media/${entry.media.id}`} style={{
                                                        fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)',
                                                        textDecoration: 'none',
                                                    }}>
                                                        {entry.media.title}
                                                        {entry.media.releaseYear && (
                                                            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>
                                                                {entry.media.releaseYear}
                                                            </span>
                                                        )}
                                                    </Link>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        {activeTab === 'watchlist' && (
                                                            <span style={{
                                                                fontSize: '0.65rem', padding: '2px 8px',
                                                                background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                                                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                            }}>Watchlist</span>
                                                        )}
                                                        {entry.liked && <Heart size={14} fill="#f43f5e" color="#f43f5e" />}
                                                        {entry.rating && (
                                                            <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                                                                {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {entry.review && (
                                                    <p style={{
                                                        fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 6,
                                                        lineHeight: 1.6,
                                                        display: '-webkit-box', WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    }}>
                                                        {entry.review}
                                                    </p>
                                                )}

                                                {entry.tags.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                                                        {entry.tags.filter(t => t !== 'Watchlist').map(tag => (
                                                            <span key={tag} style={{
                                                                fontSize: '0.7rem', padding: '2px 8px',
                                                                borderRadius: 20, background: 'var(--color-bg-elevated)',
                                                                border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',
                                                            }}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
