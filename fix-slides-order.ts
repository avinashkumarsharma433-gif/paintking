import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  const slides = \[\s*<Slide1 \/>,[\s\S]*?<ClosingSlide \/>,\n  \];/;
const slidesMatch = content.match(regex);

if (slidesMatch) {
  content = content.replace(slidesMatch[0], '');
  
  const insertTarget = 'const [scale, setScale] = useState(1);';
  content = content.replace(insertTarget, insertTarget + '\n\n' + slidesMatch[0]);
  
  content = content.replace('Math.min(18 - 1, prev + 1)', 'Math.min(slides.length - 1, prev + 1)');
}
fs.writeFileSync('src/App.tsx', content);
