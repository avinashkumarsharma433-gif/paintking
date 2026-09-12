import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/font-black/g, 'font-bold');
content = content.replace(/font-extrabold/g, 'font-semibold');
content = content.replace(/font-bold/g, 'font-medium'); // Need to run this carefully, maybe just doing it sequentially will replace all with medium, let's write a proper regex test or function.
