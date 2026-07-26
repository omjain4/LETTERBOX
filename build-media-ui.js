const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/MediaDetailPage.tsx', 'utf8');

const typeUpdate = `
    metadata: any
    userEntry?: {
        id: string
        watchedDate: string
        rating: number | null
        liked: boolean
    }
`;

code = code.replace(/    metadata: any/, typeUpdate);

const logBanner = `
                {/* Stats Bar */}`;

const bannerUI = `
                {/* User Logged Banner */}
                {media.userEntry && (
                    <div style={{
                        marginTop: 24, padding: '12px 20px',
                        background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)',
                        borderLeft: '4px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <div style={{ background: 'var(--color-primary)', borderRadius: '50%', padding: 4, display: 'flex' }}>
                            <Icon size={12} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.9rem' }}>You Logged this on {new Date(media.userEntry.watchedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'})}</strong>
                            {media.userEntry.rating && <span style={{ marginLeft: 12, color: '#fbbf24', fontSize: '0.85rem' }}>★ {media.userEntry.rating}</span>}
                        </div>
                        {media.userEntry.liked && <Heart fill="#f43f5e" color="#f43f5e" size={16} />}
                    </div>
                )}
                
                {/* Stats Bar */}`;

code = code.replace(logBanner, bannerUI);
fs.writeFileSync('apps/web/src/pages/MediaDetailPage.tsx', code);
