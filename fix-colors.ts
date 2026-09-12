import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace indigo with gold colors
content = content.replace(/indigo-600/g, 'amber-500');
content = content.replace(/indigo-50/g, 'amber-50');
content = content.replace(/indigo-100/g, 'amber-100');
content = content.replace(/indigo-200/g, 'amber-200');
content = content.replace(/indigo-800/g, 'amber-800');
content = content.replace(/indigo-900/g, 'amber-900');
content = content.replace(/indigo-500/g, 'amber-400');
content = content.replace(/#4f46e5/g, '#d4a34d');

fs.writeFileSync('src/App.tsx', content);

let constantsContent = fs.readFileSync('src/constants.ts', 'utf8');
constantsContent = constantsContent.replace(/#4f46e5/g, '#d4a34d');
constantsContent = constantsContent.replace(/#6366f1/g, '#facc15');
constantsContent = constantsContent.replace(/Indigo-600/g, 'Gold');
fs.writeFileSync('src/constants.ts', constantsContent);
