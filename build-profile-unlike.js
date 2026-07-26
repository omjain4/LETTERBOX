const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/ProfilePage.tsx', 'utf8');

const unlikeLogic = `
    const handleUnlike = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Remove from favorites?')) return;
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
    }
    const handleDeleteEntry = async`;

code = code.replace(/    const handleDeleteEntry = async/, unlikeLogic);

const favoritesHeartBlock = `
                                            <Heart size={14} fill="#f43f5e" color="#f43f5e" />
                                        </div>
`;

const onClickHeart = `
                                            <button onClick={(e) => isOwn ? handleUnlike(entry.id, e) : undefined} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, display: 'flex', cursor: isOwn ? 'pointer' : 'default' }}>
                                                <Heart size={14} fill="#f43f5e" color="#f43f5e" />
                                            </button>
                                        </div>
`;

code = code.replace(favoritesHeartBlock, onClickHeart);

fs.writeFileSync('apps/web/src/pages/ProfilePage.tsx', code);
