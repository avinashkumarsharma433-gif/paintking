import React, { useState, useEffect } from 'react';
import { finishTypes, industriesWeServe } from '../data';
import { PageBanner } from '../components/PageBanner';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { ShieldCheck, ChevronRight, Play, Cpu, Layers, HardHat, Sparkles, FlaskConical, Wrench, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OurServicesProps {
  navigateTo: (page: string) => void;
}

export const OurServices: React.FC<OurServicesProps> = ({ navigateTo }) => {
  const [activeFinishIdx, setActiveFinishIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through finishes every 3 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveFinishIdx((prev) => (prev + 1) % finishTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // 5-step process data
  const processSteps = [
    { step: "01", name: "Chemical Cleaning", desc: "Meticulous ultrasonic washing and substrate degreasing to purge all dust and oils." },
    { step: "02", name: "Surface Conditioning", desc: "Plasma/corona treatment and adhesion-promoter priming calculated for structural bond." },
    { step: "03", name: "Cleanroom Coating", desc: "Precision spray or 3D film application inside Dust-Free pressurized enclosures." },
    { step: "04", name: "ASTM Adhesion QC", desc: "Spectrophotometer Delta-E measuring alongside cross-hatch pull tests on every batch." },
    { step: "05", name: "Protective Packaging", desc: "Scratchproof film packing and ESD-safe container boxing for damage-free transit." }
  ];

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132868/paintking/home/hero_slider/paintking-hero-slide-6.webp"
        title="Engineering Services & Capabilities" 
        subtitle="Explore our comprehensive suite of high-spec spray coatings, 3D submersions, direct UV flatbeds, and high-volume injection molding services."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Our Services', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Service Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* Card 1: Spray Painting */}
          <div className="rounded-[24px] border border-[#ececec] bg-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:border-[#c09748]/50 shadow-xs hover:shadow-lg transition-all duration-300 group">
            <div className="w-full sm:w-1/2 overflow-hidden rounded-[16px] aspect-square bg-[#17191c] shrink-0">
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134546/paintking/home/services_preview/paintking-service-spray-painting-card.webp" 
                alt="Spray Painting Cleanroom Division" 
                className="w-full h-full object-cover group-hover:scale-108 duration-500 transition-transform"
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be]">Dust-Free Clean Environment</span>
                <h3 className="text-xl font-serif text-[#17191c] mt-3 group-hover:text-[#c09748] transition-colors">Spray Painting Division</h3>
                <p className="text-xs text-[#777b86] mt-2 leading-relaxed">
                  Delivering coat uniformity, durability standards, and precision color matching for engineering plastics, switchgear, and automotive bezels.
                </p>
              </div>
              <button 
                onClick={() => navigateTo('spray-painting')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191c] group-hover:text-[#c09748] transition-colors cursor-pointer"
              >
                <span>Explore Technical Specs</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2: Hydrographic Printing */}
          <div className="rounded-[24px] border border-[#ececec] bg-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:border-[#c09748]/50 shadow-xs hover:shadow-lg transition-all duration-300 group">
            <div className="w-full sm:w-1/2 overflow-hidden rounded-[16px] aspect-square bg-[#17191c] shrink-0">
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134547/paintking/home/services_preview/paintking-service-hydrographic-dipping-card.webp" 
                alt="3D Hydrographic Immersion Dipping" 
                className="w-full h-full object-cover group-hover:scale-108 duration-500 transition-transform"
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be]">3D Water Submersion</span>
                <h3 className="text-xl font-serif text-[#17191c] mt-3 group-hover:text-[#c09748] transition-colors">Hydrographic Printing</h3>
                <p className="text-xs text-[#777b86] mt-2 leading-relaxed">
                  Immersing complex 3D curved objects into activated polyvinyl films. Flawless carbon fiber, mahogany wood grain, and geometric wraps.
                </p>
              </div>
              <button 
                onClick={() => navigateTo('hydrographic')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191c] group-hover:text-[#c09748] transition-colors cursor-pointer"
              >
                <span>Explore Technical Specs</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 3: UV Digital Printing */}
          <div className="rounded-[24px] border border-[#ececec] bg-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:border-[#c09748]/50 shadow-xs hover:shadow-lg transition-all duration-300 group">
            <div className="w-full sm:w-1/2 overflow-hidden rounded-[16px] aspect-square bg-[#17191c] shrink-0">
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134548/paintking/home/services_preview/paintking-service-digital-uv-printing-card.webp" 
                alt="Direct UV Flatbed Digital Printing" 
                className="w-full h-full object-cover group-hover:scale-108 duration-500 transition-transform"
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be]">Direct Flatbed UV</span>
                <h3 className="text-xl font-serif text-[#17191c] mt-3 group-hover:text-[#c09748] transition-colors">UV Digital Printing</h3>
                <p className="text-xs text-[#777b86] mt-2 leading-relaxed">
                  Direct flatbed UV curing onto plastics, metals, glass, and wood with tactile relief embossing, micro line registration, and scratch resistance.
                </p>
              </div>
              <button 
                onClick={() => navigateTo('digital')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191c] group-hover:text-[#c09748] transition-colors cursor-pointer"
              >
                <span>Explore Technical Specs</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 4: Injection Molding */}
          <div className="rounded-[24px] border border-[#ececec] bg-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:border-[#c09748]/50 shadow-xs hover:shadow-lg transition-all duration-300 group">
            <div className="w-full sm:w-1/2 overflow-hidden rounded-[16px] aspect-square bg-[#17191c] shrink-0">
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134549/paintking/home/services_preview/paintking-service-injection-moulding-card.webp" 
                alt="Thermoplastic Injection Moulding" 
                className="w-full h-full object-cover group-hover:scale-108 duration-500 transition-transform"
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be]">Tooling & Molding</span>
                <h3 className="text-xl font-serif text-[#17191c] mt-3 group-hover:text-[#c09748] transition-colors">Injection Moulding</h3>
                <p className="text-xs text-[#777b86] mt-2 leading-relaxed">
                  High-tonnage hydraulic and electric molding machines producing parts seamlessly prepared for secondary surface finishing in-house.
                </p>
              </div>
              <button 
                onClick={() => navigateTo('injection-molding')}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191c] group-hover:text-[#c09748] transition-colors cursor-pointer"
              >
                <span>Explore Technical Specs</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: Substrate Compatibility Matrix */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Substrate Compatibility Matrix</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#17191c] mt-2">Comprehensive Material Science</h2>
            <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-[#c09748]" />
            <p className="mt-4 text-[#777b86] text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              Our chemical engineers dynamically adjust prime adhesion metrics and pre-treatment sequences based on substrate surface tension.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Plastics column */}
            <div className="p-6 rounded-[24px] bg-white border border-[#ececec] shadow-xs">
              <h3 className="text-base font-serif text-[#17191c] flex items-center gap-2.5">
                <span className="p-2 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center">
                  <FlaskConical size={16} />
                </span>
                Thermoplastics & Polymers
              </h3>
              <p className="text-[#777b86] text-xs mt-2">
                Specially formulated primers open chemical polymer chains to secure molecular level bonding.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['ABS Plastics', 'Polycarbonate (PC)', 'Polypropylene (PP)', 'Nylon (PA6/PA66)', 'High-Impact Polystyrene (HIPS)', 'PET Polyester', 'FRP / Composite GRP'].map((tag) => (
                  <span key={tag} className="text-[11px] font-medium text-[#17191c] bg-[#f2f2f3] px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Metals column */}
            <div className="p-6 rounded-[24px] bg-white border border-[#ececec] shadow-xs">
              <h3 className="text-base font-serif text-[#17191c] flex items-center gap-2.5">
                <span className="p-2 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center">
                  <Wrench size={16} />
                </span>
                Metallic Substrates
              </h3>
              <p className="text-[#777b86] text-xs mt-2">
                Rigorous degreasing/abrasions followed by anti-corrosion chemical base coatings.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Milled Steel & CRCA', 'Structural Stainless', 'Raw & Anodized Aluminum', 'Brass Hardware Gears', 'Zinc Alloy Diecastings', 'Copper Components', 'Forged Alloy Metals'].map((tag) => (
                  <span key={tag} className="text-[11px] font-medium text-[#17191c] bg-[#f2f2f3] px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: Interactive Finish/Effect Tabs */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Interactive Swatches</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">
            14 Premium Finish Profiles
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          <p className="mt-4 text-[#777b86] text-xs sm:text-sm max-w-2xl mx-auto">
            Select a finish to inspect high-resolution texture details and recommended industrial applications.
          </p>
        </div>

        {/* Tab Selection Row & Content Preview */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          
          {/* Left: 2x7 Grid of all 14 Finish Names (2 columns with hover selection) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-2 sm:gap-2.5 order-2 lg:order-1">
            {finishTypes.map((finish, idx) => (
              <button
                key={finish.id}
                onClick={() => setActiveFinishIdx(idx)}
                onMouseEnter={() => setActiveFinishIdx(idx)}
                className={`flex w-full items-center justify-between p-2.5 sm:p-3 rounded-[14px] sm:rounded-[16px] text-left cursor-pointer transition-all duration-200 ${
                  idx === activeFinishIdx 
                    ? 'bg-[#17191c] text-white font-semibold shadow-md ring-2 ring-[#c09748]' 
                    : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:bg-white hover:text-[#17191c] hover:border-[#c09748]/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span className={`text-[10px] sm:text-xs font-mono font-semibold shrink-0 ${idx === activeFinishIdx ? 'text-[#c09748]' : 'text-[#979799]'}`}>
                    {finish.number}
                  </span>
                  <span className="text-[11px] sm:text-[13px] truncate">{finish.name}</span>
                </div>
                <ChevronRight size={12} className={`shrink-0 ${idx === activeFinishIdx ? 'text-[#c09748]' : 'text-[#dcdce0]'}`} />
              </button>
            ))}
          </div>

          {/* Right: Full-Bleed Specimen Image with Bottom Gradient Finish Name Only */}
          <div className="lg:col-span-5 relative h-[360px] sm:h-[420px] lg:h-[430px] w-full overflow-hidden rounded-[24px] bg-[#17191c] border border-[#ececec] shadow-md group order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeFinishIdx}
                src={finishTypes[activeFinishIdx].image} 
                alt={finishTypes[activeFinishIdx].name} 
                initial={{ opacity: 0.4, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0 h-full w-full object-cover filter saturate-110 brightness-95 group-hover:scale-105 transition-transform duration-700"
              />
            </AnimatePresence>

            {/* Top Series Badge */}
            <div className="absolute top-4 left-4 z-20">
              <div className="text-xs font-semibold bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]"></span>
                <span>Series {finishTypes[activeFinishIdx].number}</span>
              </div>
            </div>

            {/* Bottom Gradient Overlay with ONLY Finish Name */}
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-5 px-6 flex flex-col justify-end">
              <h3 
                className="text-2xl sm:text-3xl font-serif text-white tracking-tight drop-shadow-md font-medium"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)' }}
              >
                {finishTypes[activeFinishIdx].name}
              </h3>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: Download Brochure */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

      {/* SECTION 6: Our Process (5 Steps) */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Manufacturing Discipline</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">The 5-Step Finishing Protocol</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
            <p className="mt-4 text-[#777b86] text-xs sm:text-sm max-w-2xl mx-auto">
              Our systematic pipeline guarantees consistent film thickness, high chemical resistance, and batch-to-batch color repeatability.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-5">
            {processSteps.map((item, idx) => (
              <div key={item.step} className="p-6 rounded-[24px] bg-white border border-[#ececec] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-3xl font-serif text-[#c09748] block">{item.step}</span>
                  <h3 className="text-sm font-semibold text-[#17191c] mt-3">{item.name}</h3>
                  <p className="text-[#777b86] text-[12px] leading-relaxed mt-2">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Industries We Serve */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Market Segments</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Industries We Serve</h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industriesWeServe.map((ind) => (
            <div key={ind.name} className="group overflow-hidden rounded-[24px] border border-[#ececec] bg-white p-6 shadow-xs hover:border-[#c09748]/50 transition-all">
              <div className="relative h-44 overflow-hidden rounded-[16px] bg-[#17191c]">
                <img 
                  src={ind.image} 
                  alt={ind.name} 
                  className="h-full w-full object-cover filter brightness-95 hover:scale-105 duration-500"
                />
              </div>
              <h3 className="text-base font-serif text-[#17191c] mt-5 group-hover:text-[#c09748] transition-colors">{ind.name}</h3>
              <p className="text-xs text-[#777b86] leading-relaxed mt-2">{ind.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
