const fs = require('fs');
const path = require('path');

function replaceSharedImports(dir, typesPath) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') {
                replaceSharedImports(fullPath, typesPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@letterbox/shared')) {
                let relativeDir = path.relative(path.dirname(fullPath), typesPath).replace(/\\/g, '/');
                let importPath = relativeDir === '' ? './shared' : relativeDir + '/shared';

                if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                    importPath = './' + importPath;
                }

                content = content.replace(/'@letterbox\/shared'/g, `'${importPath}'`);
                content = content.replace(/"@letterbox\/shared"/g, `"${importPath}"`);
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceSharedImports('C:/Users/Om Jain/OneDrive/Desktop/LETTERBOX-WEB/src', 'C:/Users/Om Jain/OneDrive/Desktop/LETTERBOX-WEB/src/types');
replaceSharedImports('C:/Users/Om Jain/OneDrive/Desktop/LETTERBOX-SERVER/src', 'C:/Users/Om Jain/OneDrive/Desktop/LETTERBOX-SERVER/src/types');

const webPkgPath = 'C:/Users/Om Jain/OneDrive/Desktop/LETTERBOX-WEB/package.json';
const serverPkgPath = 'C:/Users/Om Jain/OneDrive/Desktop/LETTERBOX-SERVER/package.json';

[webPkgPath, serverPkgPath].forEach(p => {
    try {
        let content = fs.readFileSync(p, 'utf8');
        let json = JSON.parse(content);
        if (json.dependencies && json.dependencies['@letterbox/shared']) { delete json.dependencies['@letterbox/shared']; }
        fs.writeFileSync(p, JSON.stringify(json, null, 2));
    } catch (e) { }
});

console.log("Imports updated successfully!");
