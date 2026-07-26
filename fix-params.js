const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.ts')) {
            let content = fs.readFileSync(p, 'utf8');
            let original = content;

            content = content.replace(/req\.params\.(id|username|listId|itemId)/g, 'String(req.params.$1)');

            if (content !== original) {
                fs.writeFileSync(p, content);
                console.log('Updated ' + p);
            }
        }
    }
}
walk('apps/server/src/modules');
