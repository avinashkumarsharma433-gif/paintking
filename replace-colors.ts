import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/amber-500/g, 'indigo-600');
content = content.replace(/amber-600/g, 'indigo-600');
content = content.replace(/amber-700/g, 'indigo-800');
content = content.replace(/amber-50/g, 'indigo-50');
content = content.replace(/amber-100/g, 'indigo-100');
content = content.replace(/amber-200/g, 'indigo-200');
content = content.replace(/amber-900/g, 'indigo-900');
content = content.replace(/bg-amber-10/g, 'bg-indigo-600/10');
content = content.replace(/#d4a34d/g, '#4f46e5');

fs.writeFileSync('src/App.tsx', content);
