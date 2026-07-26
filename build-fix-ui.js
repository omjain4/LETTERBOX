const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/ProfilePage.tsx', 'utf8');


const editBtnBlock = `{isOwnProfile && (
                                    <button 
                                        className="btn btn-secondary glow"
                                        onClick={() => setShowEditProfile(true)}
                                    >
                                        Edit Profile
                                    </button>
                                )}
                                {!isOwnProfile && profile.isFollowing ? (`;

// Revert my bad insertion
code = code.replace(editBtnBlock, `{!isOwnProfile && profile.isFollowing ? (`);

// Replace the actual native Edit Profile link!
const originalSettingsLink = `{isOwn && (
                        <Link to="/settings" className="btn btn-outline" style={{ fontSize: '0.85rem', alignSelf: 'flex-start', marginTop: 8 }}>
                            Edit Profile
                        </Link>
                    )}`;

const realEditBtn = `{isOwnProfile && (
                        <button onClick={() => setShowEditProfile(true)} className="btn btn-outline" style={{ fontSize: '0.85rem', alignSelf: 'flex-start', marginTop: 8 }}>
                            Edit Profile
                        </button>
                    )}`;
code = code.replace(originalSettingsLink, realEditBtn);


// Add the delete button for REVIEWS
const reviewLikedBlock = `{entry.liked && <Heart size={14} fill="#f43f5e" color="#f43f5e" />}`;
const deleteForReview = `{entry.liked && <Heart size={14} fill="#f43f5e" color="#f43f5e" />}
{isOwnProfile && (
    <button onClick={(e) => { e.preventDefault(); handleDeleteEntry(entry.id, 'review'); }} style={{ background:'transparent', color:'var(--color-danger)', border:'none', marginLeft:10, cursor:'pointer', fontSize: '0.8rem', fontWeight:600 }}>
        Delete
    </button>
)}`;
code = code.replace(reviewLikedBlock, deleteForReview);

fs.writeFileSync('apps/web/src/pages/ProfilePage.tsx', code);
