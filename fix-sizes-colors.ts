import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Revert base size to 1920x1080
app = app.replace(/width: '1280px', height: '720px'/g, "width: '1920px', height: '1080px'");
app = app.replace(/const scaleX = \(clientWidth\) \/ 1280;/g, "const scaleX = (clientWidth) / 1920;");
app = app.replace(/const scaleY = \(clientHeight\) \/ 720;/g, "const scaleY = (clientHeight) / 1080;");
app = app.replace(/1280, 720/g, "1920, 1080");
app = app.replace(/1280px/g, "1920px");
app = app.replace(/720px/g, "1080px");

// Replace all amber-* with accent-*
app = app.replace(/amber-/g, 'accent-');
app = app.replace(/bg-indigo-600/g, 'bg-accent-500');
app = app.replace(/text-indigo-500/g, 'text-accent-500');
app = app.replace(/border-indigo-500/g, 'border-accent-500');

fs.writeFileSync('src/App.tsx', app);

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/--color-amber-50: #FCF9F2;/g, '--color-accent-50: #FAF6ED;');
css = css.replace(/--color-amber-100: #F7EFE1;/g, '--color-accent-100: #F3EBD4;');
css = css.replace(/--color-amber-200: #EFDBB4;/g, '--color-accent-200: #E6D2B3;');
css = css.replace(/--color-amber-300: #E3C382;/g, '--color-accent-300: #D8BD8E;');
css = css.replace(/--color-amber-400: #D8A952;/g, '--color-accent-400: #CBA569;');
css = css.replace(/--color-amber-500: #D09331;/g, '--color-accent-500: #c09848;');
css = css.replace(/--color-amber-600: #BF7B27;/g, '--color-accent-600: #AB8337;');
css = css.replace(/--color-amber-700: #9F5E24;/g, '--color-accent-700: #88652A;');
css = css.replace(/--color-amber-800: #814C23;/g, '--color-accent-800: #6B4E24;');
css = css.replace(/--color-amber-900: #683E20;/g, '--color-accent-900: #57401E;');
fs.writeFileSync('src/index.css', css);
