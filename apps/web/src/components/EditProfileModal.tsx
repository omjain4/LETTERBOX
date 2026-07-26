import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import api from '../lib/api'

interface EditProfileModalProps {
    user: {
        displayName: string | null
        bio: string | null
        avatarUrl: string | null
    }
    onClose: () => void
    onSuccess: () => void
}

export default function EditProfileModal({ user, onClose, onSuccess }: EditProfileModalProps) {
    const [displayName, setDisplayName] = useState(user.displayName || '')
    const [bio, setBio] = useState(user.bio || '')
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.patch('/users/me', {
                displayName: displayName.trim(),
                bio: bio.trim(),
                avatarUrl: avatarUrl.trim()
            });
            onSuccess()
        } catch {
            alert('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', padding: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{
                background: 'var(--color-bg-card)',
                width: '100%', maxWidth: 440,
                padding: '24px 32px',
                borderRadius: 'var(--radius-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Profile</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--color-text-dim)' }}>Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="input"
                            maxLength={50}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--color-text-dim)' }}>Bio</label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className="input"
                            style={{ minHeight: 100, resize: 'vertical' }}
                            maxLength={300}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--color-text-dim)' }}>Avatar URL</label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={e => setAvatarUrl(e.target.value)}
                            className="input"
                            placeholder="https://..."
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 12 }}>
                        {loading ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    )
}
