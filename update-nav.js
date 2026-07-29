const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/Navbar.tsx', 'utf8');

content = content.replace(/import \{ Link \} from \"react-router-dom\";/, 'import { Link, useLocation } from \"react-router-dom\";');
content = content.replace(/const \{ user, logout \} = useAuth\(\);/, 'const { user, logout } = useAuth();\n    const location = useLocation();');

// Helper to replace links
const navPaths = [
    { label: 'HOME', path: '/' },
    { label: 'ACTIVITY', path: '/activity' },
    { label: 'EXPLORE', path: '/explore' },
    { label: 'DIARY', path: '/diary' },
    { label: 'LISTS', path: '/lists' }
];

navPaths.forEach(nav => {
    // Desktop links
    const desktopRegex1 = new RegExp(\<Link to=\"\\\\" className=\"btn btn-outline\"([^\>]*)\>\\\\s*\\\\\\s*</Link>\, 'g');
    content = content.replace(desktopRegex1, \<Link to=\"\\" className={location.pathname === '\' ? 'btn btn-primary' : 'btn btn-outline'}>
                                \
                            </Link>\);
                            
    const desktopRegexPrimary = new RegExp(\<Link to=\"\\\\" className=\"btn btn-primary\"([^\>]*)\>\\\\s*\\\\\\s*</Link>\, 'g');
    content = content.replace(desktopRegexPrimary, \<Link to=\"\\" className={location.pathname === '\' ? 'btn btn-primary' : 'btn btn-outline'}>
                                \
                            </Link>\);

    // Mobile links
    const mobileRegex1 = new RegExp(\<Link to=\"\\\\" className=\"btn btn-outline\"([^>]*onClick[^>]*)>\\\</Link>\, 'g');
    content = content.replace(mobileRegex1, \<Link to=\"\\" className={location.pathname === '\' ? 'btn btn-primary' : 'btn btn-outline'} >\</Link>\);
    
    const mobileRegexPrimary = new RegExp(\<Link to=\"\\\\" className=\"btn btn-primary\"([^>]*onClick[^>]*)>\\\</Link>\, 'g');
    content = content.replace(mobileRegexPrimary, \<Link to=\"\\" className={location.pathname === '\' ? 'btn btn-primary' : 'btn btn-outline'} >\</Link>\);
});

fs.writeFileSync('apps/web/src/components/Navbar.tsx', content);