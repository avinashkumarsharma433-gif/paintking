import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Slide 1 - description
content = content.replace(/text-3xl font-light/g, 'text-3xl font-normal');

// Slide 2
content = content.replace(/text-sm font-medium tracking-widest uppercase/g, 'text-xs font-semibold tracking-widest uppercase');
content = content.replace(/text-sm font-medium text-slate-700 w-full uppercase/g, 'text-xs font-normal text-slate-600 w-full uppercase tracking-wider');
content = content.replace(/text-xl font-medium text-slate-800 mb-8/g, 'text-xl font-semibold text-slate-800 mb-8');

// Single Step Slide
content = content.replace(/font-bold text-2xl/g, 'font-semibold text-2xl');
content = content.replace(/font-medium text-white bg-slate-800/g, 'font-semibold text-white bg-slate-800');
content = content.replace(/text-slate-500 text-lg mt-1 font-medium/g, 'text-slate-500 text-lg mt-1 font-normal leading-relaxed');
content = content.replace(/text-accent-900 text-2xl font-semibold leading-relaxed/g, 'text-accent-900 text-2xl font-normal leading-relaxed');

// Check out other places
content = content.replace(/text-2xl font-medium uppercase tracking-wide/g, 'text-2xl font-semibold');

// Reduce boldness of UI elements
content = content.replace(/font-bold text-lg tracking-tight/g, 'font-semibold text-lg tracking-tight');
content = content.replace(/text-\[10px\] font-bold text-slate-400 uppercase tracking-widest/g, 'text-[10px] font-semibold text-slate-400 uppercase tracking-widest');
content = content.replace(/font-bold text-xs uppercase tracking-wider/g, 'font-medium text-xs uppercase tracking-wider');

fs.writeFileSync('src/App.tsx', content);
