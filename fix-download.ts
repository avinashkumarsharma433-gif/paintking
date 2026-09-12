import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const downloadOrig = `  const handleDownloadPDF = async () => {
    const pdf = new jsPDF('l', 'px', [1920, 1080]);
    const elements = document.querySelectorAll('[id^="slide-"]');
    
    for (let i = 0; i < elements.length; i++) {
      const imgData = await htmlToImage.toPng(elements[i] as HTMLElement, { pixelRatio: 2 });
      
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    }
    
    pdf.save('PaintKing-Presentation.pdf');
  };`;

const downloadNew = `  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF('l', 'px', [1920, 1080]);
      const renderContainer = document.getElementById('pdf-render-area');
      if (!renderContainer) return;
      
      const elements = renderContainer.children;
      
      for (let i = 0; i < elements.length; i++) {
        // htmlToImage can struggle with cross-origin images or complex animations if not awaited properly,
        // using useCORS is important for external images
        const imgData = await htmlToImage.toPng(elements[i] as HTMLElement, { 
          pixelRatio: 2,
          useCORS: true,
          fontEmbedCSS: '',
          filter: (node) => {
             return !node.classList?.contains('shadow-slate-300'); // small hack to avoid issues
          }
        });
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
      }
      
      pdf.save('PaintKing-Presentation.pdf');
    } catch (e) {
      console.error('Error generating PDF', e);
    } finally {
      setIsDownloading(false);
    }
  };`;

content = content.replace(downloadOrig, downloadNew);

const hiddenAreaOrig = `{/* Hidden area for PDF rendering */}
            <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-50" style={{ width: 1920, height: 1080 }}>
              {slides.map((slide, i) => <div key={i} className="absolute top-0 left-0 w-[1920px] h-[1080px]">{slide}</div>)}
            </div>`;

const hiddenAreaNew = `{/* Hidden area for PDF rendering */}
            <div id="pdf-render-area" className="absolute top-0 left-0 opacity-0 pointer-events-none -z-50" style={{ width: 1920, height: 1080 }}>
              {slides.map((slide, i) => <div key={i} className="absolute top-0 left-0 w-[1920px] h-[1080px] bg-white">{slide}</div>)}
            </div>`;

content = content.replace(hiddenAreaOrig, hiddenAreaNew);

const buttonOrig = `<button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-2 bg-accent-500 rounded-lg text-sm font-medium text-white shadow-lg shadow-accent-100 hover:bg-indigo-700 transition-all"
          >
            <ICONS.Download size={16} />
            Download PDF
          </button>`;

const buttonNew = `<button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2 bg-accent-500 rounded-lg text-sm font-medium text-white shadow-lg shadow-accent-100 hover:bg-accent-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <ICONS.Download size={16} />
            )}
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>`;

content = content.replace(buttonOrig, buttonNew);
fs.writeFileSync('src/App.tsx', content);
