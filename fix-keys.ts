import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const effectOrig = `  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // The slide is 1920x1080. Calculate the scale to fit it inside.
        // We add some padding by multiplying by 0.95
        const scaleX = (clientWidth) / 1920;
        const scaleY = (clientHeight) / 1080;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);`;

const effectNew = `  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // The slide is 1920x1080. Calculate the scale to fit it inside.
        // We add some padding by multiplying by 0.95
        const scaleX = (clientWidth) / 1920;
        const scaleY = (clientHeight) / 1080;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slides.length]);`;

content = content.replace(effectOrig, effectNew);
fs.writeFileSync('src/App.tsx', content);
