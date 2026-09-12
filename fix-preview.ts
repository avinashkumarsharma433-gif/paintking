import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const asideOrig = `<aside className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Slide Deck</div>
          <div className="space-y-3">
            {slides.map((_, i) => (
              <div 
                key={i} 
                onClick={() => setCurrentPage(i)}
                className={\`relative aspect-video rounded-md flex flex-col justify-between overflow-hidden cursor-pointer transition-all \${currentPage === i ? 'border border-accent-500 bg-white shadow-sm p-2 text-accent-500' : 'border border-slate-200 bg-slate-100 p-2 opacity-60 hover:opacity-100 text-slate-400'}\`}
              >
                <div className={\`w-8 h-1 rounded-full \${currentPage === i ? 'bg-accent-500' : 'bg-slate-400'}\`}></div>
                {currentPage === i && (
                  <div className="space-y-1 mt-auto pb-4">
                    <div className="w-full h-1 bg-slate-100 rounded-full"></div>
                    <div className="w-2/3 h-1 bg-slate-100 rounded-full"></div>
                  </div>
                )}
                <div className="absolute right-2 bottom-2 text-[10px] font-bold">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </aside>`;

const asideNew = `<aside className="w-[15rem] bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 relative z-50">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Slide Deck</div>
          <div className="space-y-4">
            {slides.map((slide, i) => (
              <div 
                key={i} 
                onClick={() => setCurrentPage(i)}
                className={\`relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer transition-all box-border \${currentPage === i ? 'border-2 border-accent-500 shadow-md ring-2 ring-accent-500/20' : 'border border-slate-200 opacity-60 hover:opacity-100 bg-slate-100'}\`}
              >
                <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ transform: 'scale(' + (208 / 1920) + ')', width: '1920px', height: '1080px' }}>
                  {slide}
                </div>
                <div className="absolute inset-0 z-10 bg-transparent hover:bg-slate-900/5 transition-colors"></div>
                <div className="absolute bottom-1.5 right-1.5 text-[10px] font-bold text-slate-500 z-20 drop-shadow-sm bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </aside>`;

content = content.replace(asideOrig, asideNew);
fs.writeFileSync('src/App.tsx', content);
