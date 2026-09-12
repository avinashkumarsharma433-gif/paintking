import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Slide1 Replacements
content = content.replace(
  /\( *<SlideContainer id="slide-1">/g, 
  '( <SlideContainer id="slide-1">'
);

content = content.replace(
  /{* \* Header \**}/,
  '<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}> {/* Header */}'
);

content = content.replace(
  /{* \/\* Header \*\//,
  '{/* Header */}' // Keep it consistent
);

// We'll replace the full Slide1 text to be safe
const slide1Orig = `const Slide1 = () => (
  <SlideContainer id="slide-1">
    <div className="absolute inset-0 bg-slate-50 flex flex-col justify-between p-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-accent-500 rounded-2xl text-white">
          <ICONS.Crown size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-widest text-[#d4a34d]">PAINT KING</h3>
          <p className="text-xs tracking-[0.2em] text-slate-400">INNOVATIVE KINGDOM</p>
        </div>
      </div>

      {/* Main Title */}
      <div className="flex flex-col gap-4 mt-20">
        <h1 className="text-8xl font-extrabold text-slate-800 leading-tight">
          Spray Painting<br />Department
        </h1>
        <div className="h-2 w-48 bg-accent-500 rounded-full" />
        <p className="text-3xl font-light text-slate-500 mt-6">Detailed Work Process</p>
        <p className="text-accent-500 text-xl font-medium">Draft for Approval</p>
      </div>

      {/* Footer Icons */}
      <div className="flex justify-between items-end mt-auto">
        <div className="flex gap-12 text-slate-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl"><ICONS.Check size={20} className="text-accent-500" /></div>
            <span className="text-sm font-medium">Quality Focused</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl"><ICONS.Process size={20} className="text-accent-500" /></div>
            <span className="text-sm font-medium">Process Driven</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl"><ICONS.Excellence size={20} className="text-accent-500" /></div>
            <span className="text-sm font-medium">Excellence</span>
          </div>
        </div>
        <div className="text-slate-400 font-medium text-sm">2026</div>
      </div>
    </div>
  </SlideContainer>
);`;

const slide1New = `const Slide1 = () => (
  <SlideContainer id="slide-1">
    <div className="absolute inset-0 bg-slate-50 flex flex-col justify-between p-16">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-4">
        <div className="p-3 bg-accent-500 rounded-2xl text-white">
          <ICONS.Crown size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-widest text-[#d4a34d]">PAINT KING</h3>
          <p className="text-xs tracking-[0.2em] text-slate-400">INNOVATIVE KINGDOM</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex flex-col gap-4 mt-20">
        <h1 className="text-8xl font-extrabold text-slate-800 leading-tight">
          Spray Painting<br />Department
        </h1>
        <motion.div initial={{ width: 0 }} animate={{ width: 192 }} transition={{ duration: 0.6, delay: 0.8 }} className="h-5 w-48 bg-accent-500/20 rounded-full flex items-center pl-1"><div className="h-3 w-40 bg-accent-500 rounded-full" /></motion.div>
        <p className="text-3xl font-light text-slate-500 mt-6">Detailed Work Process</p>
        <p className="text-accent-500 text-xl font-bold uppercase tracking-wider">Draft for Approval</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex justify-between items-end mt-auto">
        <div className="flex gap-12 text-slate-500">
          {[
            { icon: ICONS.Check, label: 'Quality Focused' },
            { icon: ICONS.Process, label: 'Process Driven' },
            { icon: ICONS.Excellence, label: 'Excellence' }
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }} className="flex items-center gap-3">
              <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl"><item.icon size={20} className="text-accent-500" /></div>
              <span className="text-slate-800 font-bold uppercase text-sm tracking-wide">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <div className="text-slate-400 font-black text-2xl">2026</div>
      </motion.div>
    </div>
  </SlideContainer>
);`;
content = content.replace(slide1Orig, slide1New);

// Slide 2 Replacements
const slide2Orig = `const Slide2 = () => (
  <SlideContainer id="slide-2">
    <div className="p-12 bg-white flex flex-col h-full">
      <SectionTitle icon={ICONS.Process} title="Process Overview" />
      
      <div className="flex items-center justify-between mt-auto mb-auto px-4 w-full gap-4">
        {[
          { id: '01', title: 'Material Inward Process', steps: '6 Steps', tag: 'Incoming QC' },
          { id: '02', title: 'Pre-Paint Preparation', steps: '4 Steps', tag: 'Critical' },
          { id: '03', title: 'Painting Start Process', steps: '7 Steps', tag: 'Precision' },
          { id: '04', title: 'In-Process QC', steps: '5 Checks', tag: 'Continuous' },
          { id: '05', title: 'Final QC & Dispatch', steps: '4 Steps', tag: 'Delivery' }
        ].map((item, index) => (
          <React.Fragment key={item.id}>
            <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center flex-1 hover:shadow-lg transition-all border-t-4 border-t-accent-500">
              <div className="h-16 w-16 mb-4 rounded-full bg-accent-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-accent-500/30">
                {item.id}
              </div>
              <h4 className="text-xl font-extrabold text-slate-800 mb-6 h-14 flex items-center justify-center">{item.title}</h4>
              <div className="flex flex-col gap-2 mt-auto w-full">
                <span className="px-3 py-1.5 bg-accent-50 rounded-lg text-sm font-bold text-accent-800 w-full">{item.steps}</span>
                <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-sm font-bold text-slate-600 w-full">{item.tag}</span>
              </div>
            </div>
            {index < 4 && (
              <div className="text-slate-300 shrink-0 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </SlideContainer>
);`;

const slide2New = `const Slide2 = () => (
  <SlideContainer id="slide-2">
    <div className="p-12 bg-white flex flex-col h-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionTitle icon={ICONS.Process} title="Process Overview" />
      </motion.div>
      
      <div className="flex items-center justify-between mt-auto mb-auto px-4 w-full gap-4">
        {[
          { id: '01', title: 'Material Inward Process', steps: '6 Steps', tag: 'Incoming QC' },
          { id: '02', title: 'Pre-Paint Preparation', steps: '4 Steps', tag: 'Critical' },
          { id: '03', title: 'Painting Start Process', steps: '7 Steps', tag: 'Precision' },
          { id: '04', title: 'In-Process QC', steps: '5 Checks', tag: 'Continuous' },
          { id: '05', title: 'Final QC & Dispatch', steps: '4 Steps', tag: 'Delivery' }
        ].map((item, index) => (
          <React.Fragment key={item.id}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative bg-slate-50 border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col items-center text-center flex-1 hover:shadow-xl transition-all border-b-8 border-b-accent-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full blur-2xl -mt-10 -mr-10" />
              <div className="h-20 w-20 mb-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-accent-500 text-3xl font-black shadow-lg shadow-slate-200 relative z-10">
                {item.id}
              </div>
              <h4 className="text-xl font-extrabold text-slate-800 mb-8 h-16 flex items-center justify-center uppercase tracking-tight relative z-10">{item.title}</h4>
              <div className="flex flex-col gap-3 mt-auto w-full relative z-10">
                <span className="px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-black tracking-widest uppercase w-full shadow-md shadow-accent-500/20">{item.steps}</span>
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 w-full uppercase">{item.tag}</span>
              </div>
            </motion.div>
            {index < 4 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: (index * 0.15) + 0.1 }}
                className="text-accent-300 shrink-0 flex items-center justify-center"
              >
                <div className="p-3 bg-accent-50 rounded-full border border-accent-100">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </SlideContainer>
);`;
content = content.replace(slide2Orig, slide2New);

// DividerSlide Replacements
const dividerOrig = `const DividerSlide = ({ number, title, subtitle, id, icons }: { number: string; title: string; subtitle: string; id: string; icons: any[] }) => (
  <SlideContainer id={id}>
    <div className="absolute inset-0 bg-slate-50 flex items-center px-20 py-16 overflow-hidden border-b-8 border-accent-500">
      {/* Background Decor */}
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-accent-500 rounded-full blur-[160px] opacity-10" />
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4a34d 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="relative z-10 w-full flex flex-col items-start gap-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-accent-500 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-accent-500/20">
            {number}
          </div>
          <div className="h-2 w-24 bg-accent-500 rounded-full" />
        </div>
        
        <div className="flex flex-col gap-2 w-full max-w-4xl">
          <h1 className="text-7xl font-black text-slate-800 leading-[1.1] tracking-tight">
            {title.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
          </h1>
          <p className="text-2xl text-accent-500 font-bold mt-4 tracking-wide underline decoration-accent-200 underline-offset-8 decoration-4">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-8 mt-10">
          {icons.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-2 bg-accent-50 rounded-lg"><item.icon size={24} className="text-accent-500" /></div>
              <span className="text-slate-700 text-xl font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SlideContainer>
);`;

const dividerNew = `const DividerSlide = ({ number, title, subtitle, id, icons }: { number: string; title: string; subtitle: string; id: string; icons: any[] }) => (
  <SlideContainer id={id}>
    <div className="absolute inset-0 bg-slate-50 flex items-center px-20 py-16 overflow-hidden border-b-8 border-accent-500">
      {/* Background Decor */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1 }} className="absolute -right-20 -bottom-20 w-[600px] h-[600px] bg-accent-500 rounded-full blur-[160px]" />
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4a34d 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="relative z-10 w-full flex flex-col items-start gap-8">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="flex items-center gap-6">
          <div className="h-24 w-24 bg-accent-500 rounded-3xl flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-accent-500/30">
            {number}
          </div>
          <div className="h-3 w-32 bg-accent-500 rounded-full" />
        </motion.div>
        
        <div className="flex flex-col gap-4 w-full max-w-4xl mt-4">
          <h1 className="text-8xl font-black text-slate-800 leading-[1.1] tracking-tight uppercase">
            {title.split(' ').map((word, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}>
                {word}
              </motion.div>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }} className="text-3xl text-accent-500 font-bold mt-6 tracking-wide underline decoration-accent-200 underline-offset-8 decoration-[6px]">
            {subtitle}
          </motion.p>
        </div>

        <div className="flex flex-wrap gap-8 mt-12">
          {icons.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1 + i * 0.1 }} className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-8 py-5 rounded-2xl border border-slate-200 shadow-lg shadow-slate-100">
              <div className="p-3 bg-accent-50 rounded-xl"><item.icon size={32} className="text-accent-500" /></div>
              <span className="text-slate-800 text-2xl font-black uppercase tracking-wide">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </SlideContainer>
);`;
content = content.replace(dividerOrig, dividerNew);

// Remove unused unused StepDetailSlide, QCDetailSlide, FinalDetailSlide from source code
content = content.replace(/const StepDetailSlide =.*?SlideContainer>\n\);\n/s, '');
content = content.replace(/const QCDetailSlide =.*?SlideContainer>\n\);\n/s, '');
content = content.replace(/const FinalDetailSlide =.*?SlideContainer>\n\);\n/s, '');

// Also Animate Closing Slide!
// I'll see where closing Slide is defined. Let me just replace it.
const closingOrigRegex = /const ClosingSlide = \(\) => \([\s\S]*?<\/SlideContainer>\n\);/;

const closingNew = `const ClosingSlide = () => (
  <SlideContainer id="slide-last">
    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center p-20 flex-col text-center">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-500 rounded-full blur-[250px] opacity-20 pointer-events-none -mr-40 -mt-40"></div>
      
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.8, type: 'spring' }} className="p-8 bg-accent-500 rounded-[3rem] text-white shadow-2xl shadow-accent-500/40 mb-12">
        <ICONS.Crown size={120} />
      </motion.div>
      
      <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-8xl font-black text-white mb-6 tracking-tight">PAINT KING</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-3xl text-slate-400 font-medium tracking-[0.3em] uppercase mb-16">Innovative Kingdom</motion.p>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="flex items-center gap-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ICONS.Check size={28} className="text-accent-500" />
          <span className="text-slate-300 font-bold text-xl uppercase tracking-wider">Approved Process</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
        <div className="flex items-center gap-3">
          <ICONS.QC size={28} className="text-accent-500" />
          <span className="text-slate-300 font-bold text-xl uppercase tracking-wider">Quality Assured</span>
        </div>
      </motion.div>
    </div>
  </SlideContainer>
);`;
content = content.replace(closingOrigRegex, closingNew);

fs.writeFileSync('src/App.tsx', content);

console.log("Animation refactoring complete!");
