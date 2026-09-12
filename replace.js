import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const updated = content.replace(/<motion\./g, '<Motion.').replace(/<\/motion\./g, '</Motion.');
fs.writeFileSync('src/App.tsx', updated);
console.log('Replaced motion. with Motion.');
