const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/ProfilePage.tsx', 'utf8');

const importEditProfile = `import EditProfileModal from '../components/EditProfileModal'`;
code = code.replace(/import \{ UserCard, type UserData \} from '\.\.\/components\/UserCard'/, "import { UserCard, type UserData } from '../components/UserCard'\n" + importEditProfile);

const editProfileState = `const [showEditProfile, setShowEditProfile] = useState(false)\n    const [modalConfig, setModalConfig] = useState`;
code = code.replace(/const \[modalConfig, setModalConfig\] = useState/, editProfileState);

const deleteLogic = `
    const handleDeleteEntry = async (id: string, type: 'diary' | 'review' | 'favorite') => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            await api.delete(\`/diary/\${id}\`);
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
        } catch(e) {
            alert('Failed to delete entry.');
        }
    }
`;

code = code.replace('const handleUnfollow = async () => {', deleteLogic + '\n\n    const handleUnfollow = async () => {');

const editProfileButton = `
                                {isOwnProfile && (
                                    <button 
                                        className="btn btn-secondary glow"
                                        onClick={() => setShowEditProfile(true)}
                                    >
                                        Edit Profile
                                    </button>
                                )}
                                {!isOwnProfile && profile.isFollowing ? (
`;

code = code.replace(/\{!isOwnProfile && profile\.isFollowing \? \(/, editProfileButton);


const deleteDiaryBtn = `className="card" style={{ padding: 12, display: 'flex', gap: 16 }}>
                                    <div style={{ position: 'relative' }}>`;

const deleteOverlay = `<div style={{ position: 'absolute', top: -5, right: -5, zIndex: 10 }}>
                                            {isOwnProfile && (
                                                <button 
                                                  onClick={(e) => { e.preventDefault(); handleDeleteEntry(entry.id, 'diary'); }}
                                                  style={{ background: 'var(--color-bg-card)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 20, cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                                                >
                                                   Delete
                                                </button>
                                            )}
                                        </div>`;

code = code.replace(/className="card" style=\{\{ padding: 12, display: 'flex', gap: 16 \}\}>\s*<div style=\{\{ position: 'relative' \}\}>/g, deleteDiaryBtn + '\n' + deleteOverlay);

const editProfileModalHtml = `
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
`;
code = code.replace('{modalConfig && (', editProfileModalHtml + '\n            {modalConfig && (');
fs.writeFileSync('apps/web/src/pages/ProfilePage.tsx', code);
