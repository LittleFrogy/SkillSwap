const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('frontend/src');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /import\.meta\.env\.VITE_API_URL\s*\|\|\s*(["'])http:\/\/localhost:5000\1(?!\)\.replace)/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, '(import.meta.env.VITE_API_URL || $1http://localhost:5000$1).replace(/\\\\/$/, "")');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
        count++;
    }
});
console.log('Total files updated:', count);
