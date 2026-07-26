const fs = require('fs');

// 1. Fix backend: include userEntry in response
let mediaRoutes = fs.readFileSync('apps/server/src/modules/media/routes.ts', 'utf8');
mediaRoutes = mediaRoutes.replace(
    '...media,\r\n            movieMetadata: undefined,',
    '...media,\r\n            userEntry,\r\n            movieMetadata: undefined,'
);
fs.writeFileSync('apps/server/src/modules/media/routes.ts', mediaRoutes);

// 2. Fix frontend banner: replace Icon with Star (which is imported)
let mediaDetail = fs.readFileSync('apps/web/src/pages/MediaDetailPage.tsx', 'utf8');
mediaDetail = mediaDetail.replace(
    '<Icon size={12} color="#fff" />',
    '<Star size={12} color="#fff" />'
);
fs.writeFileSync('apps/web/src/pages/MediaDetailPage.tsx', mediaDetail);

// 3. Create a ConfirmModal component
const confirmModal = `import { useEffect } from 'react'

interface ConfirmModalProps {
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter') onConfirm()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onConfirm, onCancel])

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fadeIn 0.15s ease'
        }} onClick={onCancel}>
            <div style={{
                background: 'var(--color-bg-card)',
                border: '3px solid var(--color-border)',
                boxShadow: '6px 6px 0px var(--color-border)',
                padding: '32px',
                maxWidth: 400,
                width: '90%',
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{
                    fontSize: '1.1rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    marginBottom: 12, color: 'var(--color-text)'
                }}>
                    {title}
                </h3>
                <p style={{
                    color: 'var(--color-text-muted)', fontSize: '0.9rem',
                    lineHeight: 1.6, marginBottom: 28
                }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-outline"
                        style={{ padding: '10px 24px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 24px', fontSize: '0.85rem', fontWeight: 700,
                            background: '#dc2626', color: 'white', border: '2px solid #991b1b',
                            boxShadow: '3px 3px 0px #991b1b', cursor: 'pointer',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            transition: 'all 0.1s ease'
                        }}
                        onMouseDown={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px, 2px)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '1px 1px 0px #991b1b';
                        }}
                        onMouseUp={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(0,0)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '3px 3px 0px #991b1b';
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}
`;
fs.writeFileSync('apps/web/src/components/ConfirmModal.tsx', confirmModal);

// 4. Update ProfilePage to use ConfirmModal instead of confirm()
let profile = fs.readFileSync('apps/web/src/pages/ProfilePage.tsx', 'utf8');

// Add import for ConfirmModal
profile = profile.replace(
    "import EditProfileModal from '../components/EditProfileModal'",
    "import EditProfileModal from '../components/EditProfileModal'\nimport ConfirmModal from '../components/ConfirmModal'"
);

// Add state for confirm modal
profile = profile.replace(
    'const [showEditProfile, setShowEditProfile] = useState(false)',
    "const [showEditProfile, setShowEditProfile] = useState(false)\n    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null)"
);

// Replace handleUnlike to use modal instead of confirm()
const oldUnlike = "const handleUnlike = async (id: string, e: React.MouseEvent) => {\n        e.preventDefault();\n        e.stopPropagation();\n        if (!confirm('Remove from favorites?')) return;\n        try {\n            await api.patch(`/diary/${id}`, { liked: false });\n            setProfile(p => {\n                if (!p) return p;\n                const copy = { ...p };\n                copy.favorites = copy.favorites.filter(entry => entry.id !== id);\n                if (copy.recentDiary) {\n                    const idx = copy.recentDiary.findIndex(e => e.id === id);\n                    if (idx > -1) copy.recentDiary[idx].liked = false;\n                }\n                if (copy.userReviews) {\n                    const rIdx = copy.userReviews.findIndex(e => e.id === id);\n                    if (rIdx > -1) copy.userReviews[rIdx].liked = false;\n                }\n                return copy;\n            });\n        } catch(e) {\n            alert('Failed to remove from favorites.');\n        }\n    }";

const newUnlike = `const handleUnlike = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmAction({
            title: 'Remove from Favorites',
            message: 'Are you sure you want to remove this from your favorites?',
            action: async () => {
                try {
                    await api.patch(\`/diary/\${id}\`, { liked: false });
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
                } catch(e) {
                    alert('Failed to remove from favorites.');
                }
                setConfirmAction(null);
            }
        });
    }`;
profile = profile.replace(oldUnlike, newUnlike);

// Replace handleDeleteEntry to use modal instead of confirm()
const oldDelete = "const handleDeleteEntry = async (id: string, type: 'diary' | 'review' | 'favorite') => {\n        if (!confirm('Are you sure you want to delete this?')) return;";
const newDelete = "const handleDeleteEntry = (id: string, type: 'diary' | 'review' | 'favorite') => {\n        setConfirmAction({ title: 'Delete Entry', message: 'Are you sure you want to delete this entry? This action cannot be undone.', action: async () => {";
profile = profile.replace(oldDelete, newDelete);

// Close the action wrapper for handleDeleteEntry
const oldDeleteCatch = "        } catch(e) {\n            alert('Failed to delete entry.');\n        }\n    }";
const newDeleteCatch = "        } catch(e) {\n            alert('Failed to delete entry.');\n        }\n        setConfirmAction(null);\n        }});\n    }";
profile = profile.replace(oldDeleteCatch, newDeleteCatch);

// Add the ConfirmModal component before the closing div
const closingEditModal = `{showEditProfile && (`;
const confirmModalJSX = `{confirmAction && (
                <ConfirmModal
                    title={confirmAction.title}
                    message={confirmAction.message}
                    onConfirm={confirmAction.action}
                    onCancel={() => setConfirmAction(null)}
                />
            )}

            {showEditProfile && (`;
profile = profile.replace(closingEditModal, confirmModalJSX);

fs.writeFileSync('apps/web/src/pages/ProfilePage.tsx', profile);

console.log('All fixes applied successfully!');
