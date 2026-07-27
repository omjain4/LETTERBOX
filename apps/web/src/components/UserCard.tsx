import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

export interface UserData {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    _count?: {
        followers: number;
        following: number;
    }
}

interface UserCardProps {
    user: UserData;
    action?: React.ReactNode;
}

export function UserCard({ user, action }: UserCardProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            background: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)'
        }}>
            <Link to={`/profile/${user.username}`} style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--color-background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--color-border)',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <UserIcon size={28} style={{ color: 'var(--color-primary)' }} />
                )}
            </Link>

            <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.displayName || user.username}
                    </div>
                </Link>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    @{user.username}
                </div>
                {user._count && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 8, fontWeight: 600 }}>
                        {user._count.followers} FOLLOWERS <span style={{ opacity: 0.5 }}>/</span> {user._count.following} FOLLOWING
                    </div>
                )}
            </div>

            {action && (
                <div style={{ flexShrink: 0 }}>
                    {action}
                </div>
            )}
        </div>
    );
}
