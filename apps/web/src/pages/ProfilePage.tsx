import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    User as UserIcon, Calendar, Film, Heart, Star,
    BookOpen, List, Users, Loader2
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../stores/auth-context'

interface ProfileData {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    bio: string | null
    createdAt: string
    _count: {
        diaryEntries: number
        reviews: number
        lists: number
        followers: number
        following: number
    }
    stats: { totalMediaLogged: number }
    recentDiary: {
        id: string
        watchedDate: string
        rating: number | null
        liked: boolean
        media: { id: string; title: string; mediaType: string; posterUrl: string | null }
    }[]
}

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>()
    const { user: currentUser } = useAuth()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'diary' | 'lists' | 'reviews'>('diary')

    useEffect(() => {
        if (!username) return
        setLoading(true)
        api.get(`/users/${username}`)
            .then(({ data }) => setProfile(data))
            .catch(() => setProfile(null))
            .finally(() => setLoading(false))
    }, [username])

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={28} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!profile) return (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>
            <UserIcon size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>User not found.</p>
        </div>
    )

    const isOwn = currentUser?.username === username

    const TABS = [
        { key: 'diary', label: 'Diary', icon: BookOpen, count: profile._count.diaryEntries },
        { key: 'lists', label: 'Lists', icon: List, count: profile._count.lists },
        { key: 'reviews', label: 'Reviews', icon: Star, count: profile._count.reviews },
    ] as const

    const STAT_CARDS = [
        { label: 'Logged', value: profile._count.diaryEntries, icon: Calendar },
        { label: 'Reviews', value: profile._count.reviews, icon: Star },
        { label: 'Lists', value: profile._count.lists, icon: List },
        { label: 'Followers', value: profile._count.followers, icon: Users },
        { label: 'Following', value: profile._count.following, icon: UserIcon },
    ]

    return (
        <div>
            {/* Profile Header Banner */}
            <div style={{
                height: 180,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(245,158,11,0.1) 100%)',
                position: 'relative',
            }} />

            <div style={{ maxWidth: 900, margin: '-60px auto 0', padding: '0 20px 60px', position: 'relative', zIndex: 1 }}>
                {/* Avatar + Name row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 96, height: 96, borderRadius: '50%',
                        border: '4px solid var(--color-bg)',
                        background: 'var(--color-bg-elevated)',
                        overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}>
                        {profile.avatarUrl
                            ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <UserIcon size={40} style={{ color: 'var(--color-text-dim)' }} />
                        }
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {profile.displayName || profile.username}
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>@{profile.username}</p>
                    </div>
                    {isOwn && (
                        <Link to="/settings" className="btn btn-outline" style={{ fontSize: '0.85rem', alignSelf: 'flex-start', marginTop: 8 }}>
                            Edit Profile
                        </Link>
                    )}
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 600, marginBottom: 24 }}>
                        {profile.bio}
                    </p>
                )}

                {/* Stats Row */}
                <div style={{
                    display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36,
                }}>
                    {STAT_CARDS.map(s => (
                        <div key={s.label} className="card" style={{
                            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 140px',
                        }}>
                            <s.icon size={20} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)', marginBottom: 28 }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="btn btn-ghost"
                            style={{
                                borderRadius: 0,
                                borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-muted)',
                                paddingBottom: 12,
                                fontWeight: activeTab === tab.key ? 700 : 400,
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
                            }}
                        >
                            <tab.icon size={15} />
                            {tab.label}
                            <span style={{
                                background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)',
                                borderRadius: 20, padding: '2px 7px', fontSize: '0.7rem',
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'diary' && (
                    <div className="animate-fade-in">
                        <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                            RECENT ACTIVITY
                        </h2>
                        {profile.recentDiary.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No diary entries yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14 }}>
                                {profile.recentDiary.map(entry => (
                                    <Link key={entry.id} to={`/media/${entry.media.id}`} style={{ textDecoration: 'none' }}>
                                        <div className="card" style={{ overflow: 'hidden' }}>
                                            <div style={{
                                                aspectRatio: '2/3', background: 'var(--color-bg-elevated)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            }}>
                                                {entry.media.posterUrl
                                                    ? <img src={entry.media.posterUrl} alt={entry.media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <Film size={28} style={{ color: 'var(--color-text-dim)' }} />
                                                }
                                            </div>
                                            <div style={{ padding: '8px 10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {entry.liked && <Heart size={12} fill="#f43f5e" color="#f43f5e" />}
                                                    {entry.rating && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                                                            ★{entry.rating}
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{
                                                    fontSize: '0.75rem', fontWeight: 600, marginTop: 4, color: 'var(--color-text)',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                }}>
                                                    {entry.media.title}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {profile._count.diaryEntries > 5 && (
                            <Link to={isOwn ? '/diary' : `/profile/${username}/diary`} className="btn btn-outline" style={{ marginTop: 24, display: 'inline-flex' }}>
                                View all entries
                            </Link>
                        )}
                    </div>
                )}

                {activeTab === 'lists' && (
                    <div className="animate-fade-in">
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {isOwn
                                ? <><Link to="/lists" style={{ fontWeight: 600 }}>View and manage</Link> your {profile._count.lists} lists.</>
                                : `${profile.username} has ${profile._count.lists} public lists.`}
                        </p>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="animate-fade-in">
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {profile._count.reviews} reviews written.
                        </p>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
