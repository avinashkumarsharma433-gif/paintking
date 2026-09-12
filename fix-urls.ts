import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { step: 'Box Condition Inspection', url: 'https://images.unsplash.com/photo-1586864387789-228f2f61db66?auto=format&fit=crop&w=800&q=80' },
  { step: 'Quantity Verification', url: 'https://images.unsplash.com/photo-1553413077-ea49ce8fb8df?auto=format&fit=crop&w=800&q=80' },
  { step: 'Moulding Inspection', url: 'https://images.unsplash.com/photo-1580978711463-547c9da70356?auto=format&fit=crop&w=800&q=80' },
  { step: 'Incoming Quality Report', url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80' },
  { step: 'Communication', url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80' },
  { step: 'Material Approval & Storage', url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80' },
  
  { step: 'Surface Cleaning', url: 'https://images.unsplash.com/photo-1620288627223-5353c7aeb1df?auto=format&fit=crop&w=800&q=80' },
  { step: 'Sanding \\/ Surface Smoothing', url: 'https://images.unsplash.com/photo-1580983196988-cb940e4f9b8b?auto=format&fit=crop&w=800&q=80' },
  { step: 'Masking Process', url: 'https://images.unsplash.com/photo-1603525166415-5c1aeab677bc?auto=format&fit=crop&w=800&q=80' },
  { step: 'Hanging \\/ Fixture Mounting', url: 'https://images.unsplash.com/photo-1563209865-ec12a02fd6d1?auto=format&fit=crop&w=800&q=80' }
];

replacements.forEach(r => {
  const findRegex = new RegExp(`(stepTitle="${r.step}"(?:\\s|.)*?description="[^"]*")`, 'g');
  content = content.replace(findRegex, `$1\n      imageUrl="${r.url}"`);
});

fs.writeFileSync('src/App.tsx', content);
