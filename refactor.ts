import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add motion.div to SingleStepSlide
const singleStepSlideOrig = `const SingleStepSlide = ({ 
  processTitle, 
  stepTitle, 
  stepNumber, 
  items, 
  description, 
  imageUrl,
  id 
}: { 
  processTitle: string; 
  stepTitle: string; 
  stepNumber: string; 
  items: { label: string; sub?: string }[]; 
  description: string; 
  imageUrl?: string;
  id: string 
}) => (
  <SlideContainer id={id}>
    <div className="px-20 py-16 h-full flex flex-col bg-slate-50">
      <div className="flex flex-col gap-2 mb-12">
        <h2 className="text-3xl font-bold text-accent-600 uppercase tracking-widest">{processTitle}</h2>
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-white bg-slate-800 px-4 py-1 rounded-full shrink-0">Step {stepNumber}</span>
          <h1 className="text-6xl font-black text-slate-800 leading-tight">{stepTitle}</h1>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-16">
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6 mt-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl flex items-center gap-5 shadow-sm border border-slate-200">
                <div className="p-2 bg-accent-50 rounded-full">
                  <ICONS.Check size={28} className="text-green-500 shrink-0" />
                </div>
                <div>
                  <p className="text-slate-800 font-extrabold text-2xl">{item.label}</p>
                  {item.sub && <p className="text-slate-500 text-lg mt-1 font-medium">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-accent-50 border-l-8 border-accent-500 rounded-lg">
            <p className="text-accent-900 text-2xl font-semibold leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="h-full bg-slate-200 rounded-3xl overflow-hidden shadow-xl border-4 border-white flex items-center justify-center relative">
          {imageUrl ? (
            <img src={imageUrl} alt={stepTitle} className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-accent-500/10 pointer-events-none"></div>
              <div className="p-12 bg-white rounded-full shadow-lg text-accent-300">
                <ICONS.Process size={120} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </SlideContainer>
);`;

const singleStepSlideNew = `const SingleStepSlide = ({ 
  processTitle, 
  stepTitle, 
  stepNumber, 
  items, 
  description, 
  imageUrl,
  id 
}: { 
  processTitle: string; 
  stepTitle: string; 
  stepNumber: string; 
  items: { label: string; sub?: string }[]; 
  description: string; 
  imageUrl?: string;
  id: string 
}) => (
  <SlideContainer id={id}>
    <div className="px-20 py-16 h-full flex flex-col bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col gap-2 mb-12"
      >
        <h2 className="text-3xl font-bold text-accent-600 uppercase tracking-widest">{processTitle}</h2>
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-white bg-slate-800 px-4 py-1 rounded-full shrink-0">Step {stepNumber}</span>
          <h1 className="text-6xl font-black text-slate-800 leading-tight">{stepTitle}</h1>
        </div>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-16">
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6 mt-4">
            {items.map((item, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                className="bg-white p-6 rounded-2xl flex items-center gap-5 shadow-sm border border-slate-200"
              >
                <div className="p-2 bg-accent-50 rounded-full">
                  <ICONS.Check size={28} className="text-green-500 shrink-0" />
                </div>
                <div>
                  <p className="text-slate-800 font-extrabold text-2xl">{item.label}</p>
                  {item.sub && <p className="text-slate-500 text-lg mt-1 font-medium">{item.sub}</p>}
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: items.length * 0.1, ease: 'easeOut' }}
            className="mt-8 p-6 bg-accent-50 border-l-8 border-accent-500 rounded-lg"
          >
            <p className="text-accent-900 text-2xl font-semibold leading-relaxed">
              {description}
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-slate-200 rounded-3xl overflow-hidden shadow-xl border-4 border-white flex items-center justify-center relative"
        >
          {imageUrl ? (
            <img src={imageUrl} alt={stepTitle} className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-accent-500/10 pointer-events-none"></div>
              <div className="p-12 bg-white rounded-full shadow-lg text-accent-300">
                <ICONS.Process size={120} />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  </SlideContainer>
);`;

content = content.replace(singleStepSlideOrig, singleStepSlideNew);

// 2. Replace slide-8 (Painting Process – Step by Step)
const slide8OrigRegex = /<StepDetailSlide\s+id="slide-8"\s+title="Painting Process – Step by Step"[\s\S]*?\]\}\s+\/>/m;

const slide8New = `<SingleStepSlide
      id="slide-8-1"
      processTitle="Painting Process – Step by Step"
      stepNumber="1"
      stepTitle="Booth & Paint Prep"
      items={[{ label: 'Dust Free Booth Setup', sub: 'Cleaning & air filtration check' }, { label: 'Paint Preparation', sub: 'Paint stirring & thinner ratio control' }]}
      description="Ensures a controlled environment for perfect application."
      imageUrl="https://images.unsplash.com/photo-1621257125345-422f9de05ec5?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-8-2"
      processTitle="Painting Process – Step by Step"
      stepNumber="2"
      stepTitle="Setup & Checks"
      items={[{ label: 'Viscosity Check', sub: 'Ford cup se viscosity measure' }, { label: 'Spray Gun Setup', sub: 'Nozzle selection & pressure setting' }]}
      description="Calibrates equipment for uniform spray consistency."
      imageUrl="https://images.unsplash.com/photo-1634547514336-d24260b4578b?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-8-3"
      processTitle="Painting Process – Step by Step"
      stepNumber="3"
      stepTitle="Application"
      items={[{ label: 'Primer Application', sub: 'Uniform coating & flash time' }, { label: 'Top Coat Spray', sub: 'Even distance & cross pattern' }]}
      description="Applies multi-layer coating with precise movements."
      imageUrl="https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-8-4"
      processTitle="Painting Process – Step by Step"
      stepNumber="4"
      stepTitle="Post-Process"
      items={[{ label: 'Flash Time & Drying', sub: 'Air dry or oven dry methods' }, { label: 'Monitoring', sub: 'Temperature & time tracking' }]}
      description="Cures the paint effectively for maximum durability."
      imageUrl="https://images.unsplash.com/photo-15ec44342410-b96919e13b86?auto=format&fit=crop&w=800&q=80"
    />`;

content = content.replace(slide8OrigRegex, slide8New);

// 3. Replace slide-10 (Quality Control Checkpoints)
const slide10OrigRegex = /<QCDetailSlide\s+id="slide-10"[\s\S]*?\]\}\s+\/>/m;

const slide10New = `<SingleStepSlide
      id="slide-10-1"
      processTitle="Quality Control Checkpoints"
      stepNumber="1"
      stepTitle="Viscosity & Delta Check"
      items={[{ label: 'Viscosity Check', sub: 'Ford cup measurement for paint consistency (Every Batch)' }, { label: 'Delta Check', sub: 'Shade variation control and color matching (Every 1 Hour)' }]}
      description="Regular physical quality control tests on paint consistency."
      imageUrl="https://plus.unsplash.com/premium_photo-1664303310931-152e9fcf422c?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-10-2"
      processTitle="Quality Control Checkpoints"
      stepNumber="2"
      stepTitle="Verification Tests"
      items={[{ label: 'Cross Tape Test', sub: 'Paint adhesion strength verification' }, { label: 'Gloss Meter Check', sub: 'Gloss value measurement against standard' }]}
      description="Confirms functional characteristics and durability of the finished product."
      imageUrl="https://images.unsplash.com/photo-1622322300063-2282afdf6bf3?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-10-3"
      processTitle="Quality Control Checkpoints"
      stepNumber="3"
      stepTitle="Visual Inspection"
      items={[{ label: 'Surface Anomalies', sub: 'Dust Marks or particle detection' }, { label: 'Application Defects', sub: 'Orange Peel, Flow Marks, or Pin Holes check' }]}
      description="A meticulous visual scan ensures an unblemished visual surface."
      imageUrl="https://images.unsplash.com/photo-1614041189445-667793ce8bb2?auto=format&fit=crop&w=800&q=80"
    />`;

content = content.replace(slide10OrigRegex, slide10New);

// 4. Replace slide-12 (Final Quality & Dispatch)
const slide12OrigRegex = /<FinalDetailSlide id="slide-12" \/>/;

const slide12New = `<SingleStepSlide
      id="slide-12-1"
      processTitle="Final Quality & Dispatch"
      stepNumber="1"
      stepTitle="Final Quality Check"
      items={[{ label: 'Dust & Scratch Check', sub: 'Dust particle and scratches inspection' }, { label: 'Surface Verification', sub: 'Even paint spread, colour consistency, surface smoothness' }]}
      description="Last-mile rigorous check before giving the go-ahead."
      imageUrl="https://images.unsplash.com/photo-1582214695029-796fb3c9b7fa?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-12-2"
      processTitle="Final Quality & Dispatch"
      stepNumber="2"
      stepTitle="Box/Bin Segregation System"
      items={[{ label: 'Blue Bin (Approved)', sub: 'Material passed all quality checks' }, { label: 'Red Bin (Rejected)', sub: 'Material failed checks, sent for rework or rejection' }]}
      description="Ensures zero mix-up between approved and defective pieces."
      imageUrl="https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-12-3"
      processTitle="Final Quality & Dispatch"
      stepNumber="3"
      stepTitle="Packing Process"
      items={[{ label: 'Final Cleaning', sub: 'Air blow before packing to remove loose particles' }, { label: 'Protective Packing', sub: 'Use of bubble wrap and separators' }, { label: 'Batch Labeling', sub: 'Date and batch marking for traceability' }]}
      description="Safeguards the product against all transit damages."
      imageUrl="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
    />,
    <SingleStepSlide
      id="slide-12-4"
      processTitle="Final Quality & Dispatch"
      stepNumber="4"
      stepTitle="Dispatch"
      items={[{ label: 'Loading Sequence', sub: 'Careful loading in dispatch vehicle according to delivery points' }, { label: 'Documentation', sub: 'Invoices, Delivery Challans ready for client hand-off' }]}
      description="Structured rollout to deliver the required materials fast."
      imageUrl="https://images.unsplash.com/photo-1601597401768-e4b77d6ba56e?auto=format&fit=crop&w=800&q=80"
    />`;

content = content.replace(slide12OrigRegex, slide12New);

fs.writeFileSync('src/App.tsx', content);

console.log("Refactoring complete");
