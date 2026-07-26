import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    User as UserIcon, Calendar, Film, Heart, Star,
    BookOpen, List, Users, Loader2, X
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../stores/auth-context'
import MonthlyActivityHeatmap from '../components/MonthlyActivityHeatmap'
import { UserCard, type UserData } from '../components/UserCard'
import EditProfileModal from '../components/EditProfileModal'

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
    favorites: {
        id: string
        watchedDate: string
        rating: number | null
        liked: boolean
        media: { id: string; title: string; mediaType: string; posterUrl: string | null }
    }[]
    activityData: Record<string, number>
    userReviews?: {
        id: string
        watchedDate: string
        rating: number | null
        review: string
        liked: boolean
        media: { id: string; title: string; mediaType: string; posterUrl: string | null; releaseYear: number | null }
    }[]
    isFollowing?: boolean
}

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>()
    const { user: currentUser } = useAuth()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)


    const handleUnlike = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Remove from favorites?')) return;
        try {
            await api.patch(`/diary/${id}`, { liked: false });
            setProfile(p => {
                if (!p) return p;
                const copy = { ...p };
                copy.favorites = copy.favorites.filter(entry => entry.id !== id);
                if (copy.recentDiary) {
                    const idx = copy.recentDiary.findIndex(e => e.id === id);
                    if (idx > -1) copy.recentDiary[idx].liked = false;
                }
                if (copy.userReviews) {
                    const rIdx = copy.userReviews.findIndex(e => e.id === id);
                    if (rIdx > -1) copy.userReviews[rIdx].liked = false;
                }
                return copy;
            });
        } catch (e) {
            alert('Failed to remove from favorites.');
        }
    }
    const handleDeleteEntry = async (id: string, type: 'diary' | 'review' | 'favorite') => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            await api.delete(`/diary/${id}`);
            setProfile(p => {
                if (!p) return p;
                const copy = { ...p };
                if (type === 'diary') copy.recentDiary = copy.recentDiary.filter(e => e.id !== id);
                if (type === 'favorite') copy.favorites = copy.favorites.filter(e => e.id !== id);
                if (type === 'review' && copy.userReviews) {
                    copy.userReviews = copy.userReviews.filter(e => e.id !== id);
                }
                copy._count.diaryEntries = copy._count.diaryEntries - 1;
                return copy;
            });
        } catch (e) {
            alert('Failed to delete entry.');
        }
    }
    const [activeTab, setActiveTab] = useState<'diary' | 'lists' | 'reviews'>('diary')
    const [isSubmittingFollow, setIsSubmittingFollow] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [modalConfig, setModalConfig] = useState<{ title: string, users: UserData[] } | null>(null);
    const [loadingModal, setLoadingModal] = useState(false);

    const fetchProfile = () => {
        if (!username) return
        setLoading(true)
        api.get(`/users/${username}`)
            .then(({ data }) => setProfile(data))
            .catch(() => setProfile(null))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchProfile()
    }, [username, currentUser])

    const handleFollowToggle = async () => {
        if (!currentUser || !profile || isSubmittingFollow) return;
        setIsSubmittingFollow(true);
        try {
            if (profile.isFollowing) {
                await api.delete(`/users/${username}/follow`);
                setProfile(prev => prev ? { ...prev, isFollowing: false, _count: { ...prev._count, followers: prev._count.followers - 1 } } : prev);
            } else {
                await api.post(`/users/${username}/follow`);
                setProfile(prev => prev ? { ...prev, isFollowing: true, _count: { ...prev._count, followers: prev._count.followers + 1 } } : prev);
            }
        } catch (e) {
            console.error("Failed to toggle follow status");
        } finally {
            setIsSubmittingFollow(false);
        }
    };

    const fetchSocialList = async (type: 'followers' | 'following') => {
        setLoadingModal(true);
        setModalConfig({ title: type === 'followers' ? 'Followers' : 'Following', users: [] });
        try {
            const { data } = await api.get(`/users/${username}/${type}`);
            setModalConfig({ title: type === 'followers' ? 'Followers' : 'Following', users: data });
        } catch (e) {
            console.error(e);
            setModalConfig(null);
        } finally {
            setLoadingModal(false);
        }
    };

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

    const renderTabContent = () => {
        if (activeTab === 'diary') {
            return (
                <div className="animate-fade-in">
                    <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                        RECENT ACTIVITY
                    </h2>
                    {profile.recentDiary.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No diary entries yet.</p>
                    ) : (
                        <div className="activity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14 }}>
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
            )
        }

        if (activeTab === 'lists') {
            return (
                <div className="animate-fade-in">
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {isOwn
                            ? <><Link to="/lists" style={{ fontWeight: 600 }}>View and manage</Link> your {profile._count.lists} lists.</>
                            : `${profile.username} has ${profile._count.lists} public lists.`}
                    </p>
                    {[
                        { label: 'Films', value: profile.stats.totalMediaLogged, icon: Film },
                        { label: 'Diary', value: profile._count?.diaryEntries ?? 0, icon: BookOpen },
                        { label: 'Reviews', value: profile._count?.reviews ?? 0, icon: Star },
                        { label: 'Lists', value: profile._count?.lists ?? 0, icon: List },
                        { label: 'Followers', value: profile._count?.followers ?? 0, icon: Users, action: () => fetchSocialList('followers') },
                        { label: 'Following', value: profile._count?.following ?? 0, icon: Users, action: () => fetchSocialList('following') },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            flex: '1 1 120px',
                            background: 'var(--color-surface)',
                            border: '2px solid var(--color-border)',
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 8,
                            cursor: stat.action ? 'pointer' : 'default',
                            transition: 'all 0.1s ease',
                        }}
                            onClick={stat.action}
                            onMouseEnter={(e) => stat.action && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => stat.action && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            <stat.icon size={20} />
                            <span style={{ fontWeight: 800 }}>{stat.value}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            )
        }

        if (activeTab === 'reviews') {
            return (
                <div style={{ padding: '40px 0', color: 'var(--color-text-muted)' }}>
                    {(!profile.userReviews || profile.userReviews.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            No reviews written yet.
                        </div>
                    )}
                    {profile.userReviews && profile.userReviews.map((entry) => (
                        <div key={entry.id} style={{
                            padding: '24px',
                            background: 'var(--color-bg-elevated)',
                            borderLeft: '4px solid var(--color-primary)',
                            marginBottom: 16,
                            display: 'flex',
                            gap: 16
                        }}>
                            {entry.media.posterUrl && (
                                <Link to={`/media/${entry.media.id}`} style={{ flexShrink: 0 }}>
                                    <div style={{
                                        width: 80, aspectRatio: '2/3',
                                        border: '2px solid var(--color-border)',
                                        boxShadow: '3px 3px 0px var(--color-border)',
                                        overflow: 'hidden'
                                    }}>
                                        <img src={entry.media.posterUrl} alt={entry.media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </Link>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                        <Link to={`/media/${entry.media.id}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                                            {entry.media.title} {entry.media.releaseYear && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '1rem' }}>({entry.media.releaseYear})</span>}
                                        </Link>
                                    </h3>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        {entry.rating !== null && (
                                            <div style={{ color: '#fbbf24', display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Star fill="#fbbf24" size={14} />
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{entry.rating}</span>
                                            </div>
                                        )}
                                        {entry.liked && <Heart size={14} fill="#f43f5e" color="#f43f5e" />}
                                        {isOwn && (
                                            <button onClick={(e) => { e.preventDefault(); handleDeleteEntry(entry.id, 'review'); }} style={{ background: 'transparent', color: 'var(--color-danger)', border: 'none', marginLeft: 10, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 16 }}>
                                    REVIEWED ON {new Date(entry.watchedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
                                </div>
                                <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                                    {entry.review}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )
        }
    }

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
                <div className="profile-header" style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
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

                        {profile.bio && (
                            <p style={{
                                marginTop: 16,
                                color: 'var(--color-text-dim)',
                                lineHeight: 1.6,
                                maxWidth: '100%',
                            }}>
                                {profile.bio}
                            </p>
                        )}

                        {currentUser && currentUser.username !== profile.username && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={isSubmittingFollow}
                                className={profile.isFollowing ? "btn-outline" : "btn-primary"}
                                style={{
                                    marginTop: 16,
                                    padding: '8px 24px',
                                    width: 'fit-content',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {profile.isFollowing ? (isSubmittingFollow ? "..." : "Following") : (isSubmittingFollow ? "..." : "Follow")}
                            </button>
                        )}
                    </div>
                    {isOwn && (
                        <button onClick={() => setShowEditProfile(true)} className="btn btn-outline" style={{ fontSize: '0.85rem', alignSelf: 'flex-start', marginTop: 8 }}>
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Stats Row */}
                <div className="profile-stats-grid" style={{
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

                {/* Favorite Films */}
                {profile.favorites && profile.favorites.length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                            FAVORITE PICKS
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            {profile.favorites.map((entry, idx) => (
                                <Link key={idx} to={`/media/${entry.media.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        aspectRatio: '2/3', background: 'var(--color-bg-card)',
                                        border: '3px solid var(--color-border)',
                                        borderRadius: 'var(--radius-none)',
                                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '4px 4px 0px var(--color-border)', position: 'relative',
                                        transition: 'transform 0.1s, box-shadow 0.1s',
                                    }}>
                                        {entry.media.posterUrl ? (
                                            <img src={entry.media.posterUrl} alt={entry.media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Film size={28} style={{ color: 'var(--color-text-dim)' }} />
                                        )}
                                        <div style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: '50%',
                                            cursor: isOwn ? 'pointer' : 'default',
                                        }} onClick={(e) => { if (isOwn) { e.preventDefault(); e.stopPropagation(); handleUnlike(entry.id, e); } }}>
                                            <Heart size={14} fill="#f43f5e" color="#f43f5e" />
                                        </div>
                                    </div>
                                    <p style={{
                                        fontSize: '0.8rem', fontWeight: 700, marginTop: 8, color: 'var(--color-text)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {entry.media.title}
                                    </p>
                                </Link>
                            ))}
                            {[...Array(Math.max(0, 4 - profile.favorites.length))].map((_, i) => (
                                <div key={`empty-${i}`} style={{
                                    aspectRatio: '2/3', background: 'var(--color-bg-elevated)',
                                    border: '3px dashed var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: 0.5
                                }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Empty</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                {renderTabContent()}

                {/* Activity Heatmap */}
                {profile.activityData && (
                    <MonthlyActivityHeatmap activityData={profile.activityData} />
                )}
            </div>


            {showEditProfile && (
                <EditProfileModal
                    user={profile}
                    onClose={() => setShowEditProfile(false)}
                    onSuccess={() => {
                        setShowEditProfile(false);
                        window.location.reload();
                    }}
                />
            )}

            {modalConfig && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: 24,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setModalConfig(null)}>
                    <div style={{
                        width: '100%',
                        maxWidth: 600,
                        backgroundColor: 'var(--color-background)',
                        border: '2px solid var(--color-primary)',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '12px 12px 0 var(--color-primary)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: 24, borderBottom: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', margin: 0, color: 'var(--color-text)' }}>
                                {modalConfig.title}
                            </h2>
                            <button onClick={() => setModalConfig(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                                <X size={28} />
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {loadingModal ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--color-primary)' }}>
                                    <Loader2 className="animate-spin" size={40} />
                                </div>
                            ) : modalConfig.users.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40, fontWeight: 700, textTransform: 'uppercase' }}>
                                    NO {modalConfig.title.toUpperCase()} FOUND
                                </div>
                            ) : (
                                modalConfig.users.map((u: any) => (
                                    <div key={u.id} onClick={() => setModalConfig(null)}>
                                        <UserCard user={u} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
