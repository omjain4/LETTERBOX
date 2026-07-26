import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { List, Plus, Lock, Globe, Film, Loader2, Trash2 } from 'lucide-react'
import api from '../lib/api'

interface ListSummary {
    id: string
    name: string
    description: string | null
    isPublic: boolean
    isRanked: boolean
    updatedAt: string
    _count: { items: number }
    items: { media: { id: string; posterUrl: string | null; title: string } }[]
}

function CreateListModal({ onClose, onCreated }: { onClose: () => void; onCreated: (list: ListSummary) => void }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [isRanked, setIsRanked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/lists', { name, description, isPublic, isRanked })
            onCreated(data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create list')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 24 }}>Create New List</h2>
                {error && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, display: 'block' }}>List Name</label>
                        <input className="input" placeholder="My Favourite Films" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, display: 'block' }}>Description (optional)</label>
                        <textarea className="input" placeholder="What's this list about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                            Public
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={isRanked} onChange={e => setIsRanked(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                            Ranked
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Creating…' : 'Create List'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ListsPage() {
    const [lists, setLists] = useState<ListSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)

    const fetchLists = () => {
        setLoading(true)
        api.get('/lists')
            .then(({ data }) => setLists(data.data))
            .catch(() => setLists([]))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchLists() }, [])

    const deleteList = async (id: string) => {
        if (!confirm('Delete this list?')) return
        await api.delete(`/lists/${id}`)
        setLists(ls => ls.filter(l => l.id !== id))
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        Your <span className="gradient-text">Lists</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                        Curate collections mixing any media type
                    </p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary glow">
                    <Plus size={16} /> New List
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={28} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : lists.length === 0 ? (
                <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <List size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No lists yet</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Create your first list to get started.</p>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                        <Plus size={16} /> Create a List
                    </button>
                </div>
            ) : (
                <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {lists.map(list => (
                        <div key={list.id} className="card" style={{ overflow: 'hidden' }}>
                            {/* Poster Strip */}
                            <div style={{ display: 'flex', height: 80, background: 'var(--color-bg-elevated)', overflow: 'hidden' }}>
                                {list.items.slice(0, 4).map((item, i) => (
                                    <div key={i} style={{ flex: 1, overflow: 'hidden' }}>
                                        {item.media.posterUrl
                                            ? <img src={item.media.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={14} style={{ color: 'var(--color-text-dim)' }} /></div>
                                        }
                                    </div>
                                ))}
                                {list.items.length === 0 && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <List size={24} style={{ color: 'var(--color-text-dim)' }} />
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <Link to={`/lists/${list.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: 4 }}>{list.name}</h3>
                                    </Link>
                                    <button onClick={() => deleteList(list.id)} className="btn btn-ghost" style={{ padding: 4, color: 'var(--color-text-dim)', flexShrink: 0 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {list.description && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {list.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {list.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                                        {list.isPublic ? 'Public' : 'Private'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>·</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{list._count.items} item{list._count.items !== 1 ? 's' : ''}</span>
                                    {list.isRanked && (
                                        <>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>·</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Ranked</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateListModal
                    onClose={() => setShowCreate(false)}
                    onCreated={list => { setLists(ls => [list as any, ...ls]); setShowCreate(false) }}
                />
            )}
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
