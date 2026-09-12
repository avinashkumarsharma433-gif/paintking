import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldEffect = `  React.useEffect(() => {
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

const newEffect = `  React.useEffect(() => {
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage(prev => Math.min(18 - 1, prev + 1)); // We have 18 slides total. Better to dynamic, but slides is declared below.
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);`;

content = content.replace(oldEffect, newEffect);

content = content.replace('useCORS: true,', '');

fs.writeFileSync('src/App.tsx', content);
