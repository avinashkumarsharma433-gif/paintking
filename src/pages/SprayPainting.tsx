import React, { useState } from 'react';
import { finishTypes, faqCategories } from '../data';
import { PageBanner } from '../components/PageBanner';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { ChevronRight, ChevronDown, CheckCircle2, ShieldCheck, Paintbrush, Zap, Sparkles } from 'lucide-react';

interface SprayPaintingProps {
  navigateTo: (page: string) => void;
}

export const SprayPainting: React.FC<SprayPaintingProps> = ({ navigateTo }) => {
  const [activeFinishIdx, setActiveFinishIdx] = useState(0);
  const [activeFaqCategory, setActiveFaqCategory] = useState('pricing');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const b2bUseCases = [
    {
      title: "Automotive Components",
      points: ["ABS & Polycarbonate dashboards, bezels, switch frames.", "Matte, dual-tone metallic, and velvet soft-feel topcoats.", "Rigid thickness control within ±2 microns, preserving snap fits.", "Narrow Delta-E color tolerance boundaries (< 0.5)."]
    },
    {
      title: "Electronics & Switchgear",
      points: ["Modular switchplates, buttons, and high-spec enclosures.", "Pressurized Dust-Free dust-free positive-air cleanrooms.", "High-definition technical legends and icons via pad/screen print.", "Scratchproof, anti-fingerprint polyurethane formulations."]
    },
    {
      title: "Home Appliances",
      points: ["Control panels, dials, cabinet handles & fascias (CRCA/ABS).", "High mechanical durability and household chemical resistance.", "ASTM 5B cross-hatch adhesion verifying zero peeling over time.", "Batch-to-batch color consistency for repeat production runs."]
    },
    {
      title: "Consumer Luxury Goods",
      points: ["Cosmetics jars, perfume caps, and personal audio housings.", "High-luster piano gloss, pastels, and metallic effect layers.", "Soft-touch tactile coatings for premium hand-feel.", "RoHS compliant, non-toxic organic compounds."]
    },
    {
      title: "Architectural Hardware",
      points: ["Door levers, metal brackets, aluminum extrusion trims.", "Vintage brushed brass and satin metallic likenesses.", "Durable clear acrylic and polyurethane protective shields.", "High friction, moisture, and salt-spray corrosion defense."]
    },
    {
      title: "Industrial & Heavy OEM",
      points: ["Heavy sheet enclosures, machinery covers, structures (FRP/CRCA).", "Epoxy anti-corrosion primers with cross-linked 2K finishes.", "Unmatched weather, chemical, rust, and UV resistance.", "Engineered for harsh plant and outdoor field environments."]
    }
  ];

  const materialTags = ['ABS Plastic', 'Polycarbonate (PC)', 'Polypropylene (PP)', 'Nylon (PA6/PA66)', 'CRCA Cold Rolled Steel', 'Stainless Steel (SS)', 'Aluminum Alloy', 'FRP / Composite GRP'];

  const qaProtocols = [
    { id: "01", header: "Four-Stage Quality Audits", body: "Structured verification spanning incoming resin checks, in-process viscosity measures, dry film inspection, and final AQL sampling." },
    { id: "02", header: "Spectrophotometer Diagnostics", body: "Every paint batch is calibrated digitally against master RAL/Pantone color standards, maintaining Delta-E tolerances < 0.5." },
    { id: "03", header: "ASTM Adhesion Verification", body: "Mechanical tape-pull grid tests (ASTM D3359), 60° specular gloss reflectometry, and digital dry film thickness (DFT) logging." },
    { id: "04", header: "Cleanroom Atmospheric Logs", body: "Positive-pressure booths monitor temperature, humidity, and exhaust velocity with systematic root-cause CAPA protocols." }
  ];

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787131950/paintking/spray_painting/hero_and_showcase/automotive-tail-light-spray-painting-mumbai.webp"
        title="High-Precision Spray Painting" 
        subtitle="Transforming engineering polymers & metals with advanced Dust-Free Clean Environment liquid and tactile soft-feel coatings."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Our Services', pageId: 'services' }, { label: 'Spray Painting', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Service Overview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          
          {/* Image Left */}
          <div className="lg:col-span-5 overflow-hidden rounded-[24px] border border-[#ececec] shadow-sm h-[320px] sm:h-[450px] bg-[#17191c]">
            <img 
              src="https://images.unsplash.com/photo-1541829011-8319f36f1242?auto=format&fit=crop&q=80&w=800" 
              alt="High precision liquid spray painting on switches" 
              className="h-full w-full object-cover filter saturate-110 object-center brightness-95"
            />
          </div>

          {/* Context Right */}
          <div className="lg:col-span-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Core Manufacturing Competence</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2 leading-tight">Advanced Spray Coating Systems</h2>
            <div className="mt-4 h-0.5 w-12 bg-[#c09748] rounded-full" />
            
            <p className="mt-6 text-[#777b86] text-[15px] leading-relaxed">
              Spray painting constitutes the core of PaintKing's surface engineering. Our manufacturing facilities house automated overhead conveyors, pressurized cleanrooms operating Dust-Free particulate filtration, and precision HVLP atomization guns.
            </p>
            <p className="mt-4 text-[#777b86] text-[15px] leading-relaxed">
              We process high-complexity finishes across ABS, Polycarbonate, Nylon, stainless steel, and aluminum components. Whether for automotive interior bezels, modular switch plates, or outdoor industrial housings, our dual-component finishes bond chemically to eliminate chipping.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-center gap-2.5 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Dust-Free Clean Environment Pressurization</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Digital Spectrophotometer (Delta-E &lt; 0.5)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Automated Conveyor Baking Ovens</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>ASTM D3359 Cross-Hatch 5B Certified</span>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => navigateTo('contact')}
                className="pill-btn-filled text-sm cursor-pointer"
              >
                Request Free Sample Coupon →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: Before and After Slider */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <BeforeAfterSlider />
        </div>
      </section>

      {/* SECTION 4: Commercial Applications Grid */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Industrial Applications</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Sectors & OEM Use Cases</h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          <p className="mt-4 text-[#777b86] text-xs sm:text-sm">
            Formulations adapted to specific mechanical stress, thermal range, and cosmetic expectations across industries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {b2bUseCases.map((useCase) => (
            <div key={useCase.title} className="p-6 rounded-[24px] bg-white border border-[#ececec] flex flex-col justify-between shadow-xs hover:border-[#c09748]/50 transition-all duration-300">
              <div>
                <h3 className="text-base font-serif text-[#17191c] border-b border-[#f2f2f3] pb-3 mb-4">
                  {useCase.title}
                </h3>
                <ul className="space-y-2.5">
                  {useCase.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-[#777b86] leading-relaxed">
                      <span className="text-[#c09748] mt-0.5 shrink-0 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Substrate tags */}
        <div className="mt-12 text-center p-6 bg-[#fafafb] rounded-[20px] border border-[#ececec]">
          <h4 className="text-[11px] font-semibold text-[#979799] uppercase tracking-wider mb-4">Processed Substrate Palette:</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {materialTags.map((tag) => (
              <span key={tag} className="text-[11px] font-medium text-[#17191c] bg-white border border-[#ececec] px-3 py-1.5 rounded-full shadow-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Quality Assurance & Standards */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Testing Protocols</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Quality Assurance & Adhesion Audits</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {qaProtocols.map((p) => (
              <div key={p.id} className="p-6 rounded-[24px] bg-white border border-[#ececec] flex flex-col justify-between shadow-xs">
                <div>
                  <div className="text-2xl font-serif text-[#c09748] mb-3">
                    {p.id}
                  </div>
                  <h3 className="text-sm font-semibold text-[#17191c]">{p.header}</h3>
                  <p className="text-[#777b86] text-xs mt-2.5 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: Key Merits */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Process Advantages</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Benefits of PaintKing Liquid Spray</h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white border border-[#ececec] rounded-[24px] shadow-xs flex flex-col items-start">
            <div className="h-10 w-10 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center mb-4">
              <Paintbrush size={18} className="text-[#c09748]" />
            </div>
            <h3 className="text-base font-serif text-[#17191c]">Micrometric Uniformity</h3>
            <p className="text-[#777b86] text-xs sm:text-sm mt-2 leading-relaxed">
              Pneumatic HVLP atomization applies an ultra-thin, homogenous layer across complex fillets and ribs, eliminating drip marks and orange peel.
            </p>
          </div>
          <div className="p-7 bg-white border border-[#ececec] rounded-[24px] shadow-xs flex flex-col items-start">
            <div className="h-10 w-10 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center mb-4">
              <Zap size={18} className="text-[#c09748]" />
            </div>
            <h3 className="text-base font-serif text-[#17191c]">High-Throughput Capacity</h3>
            <p className="text-[#777b86] text-xs sm:text-sm mt-2 leading-relaxed">
              Automated continuous conveyor loops cure hundreds of pieces per hour, ensuring on-schedule delivery for high-volume consumer product launches.
            </p>
          </div>
          <div className="p-7 bg-white border border-[#ececec] rounded-[24px] shadow-xs flex flex-col items-start">
            <div className="h-10 w-10 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center mb-4">
              <ShieldCheck size={18} className="text-[#c09748]" />
            </div>
            <h3 className="text-base font-serif text-[#17191c]">Chemical & Solvent Resistance</h3>
            <p className="text-[#777b86] text-xs sm:text-sm mt-2 leading-relaxed">
              Dual-component polyurethane topcoats withstand intensive alcohol wipe tests, detergent exposure, and rigorous scratch abrasion standards.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7: FAQ Accordions */}
      <section className="bg-[#fafafb] border-t border-[#ececec] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Technical Guidance</span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#17191c] mt-2">Spray Painting FAQs</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          {/* Tab categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveFaqCategory(cat.id);
                  setOpenFaqIndex(0);
                }}
                className={`pill-btn text-xs font-medium px-4 py-2 cursor-pointer transition-all ${
                  activeFaqCategory === cat.id 
                    ? 'bg-[#17191c] text-white' 
                    : 'bg-white text-[#777b86] border border-[#ececec] hover:text-[#17191c]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Accordions */}
          <div className="space-y-3">
            {faqCategories.find(c => c.id === activeFaqCategory)?.questions.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="rounded-[16px] border border-[#ececec] bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-medium text-[#17191c] text-[14px] cursor-pointer hover:bg-[#fafafb]"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown size={16} className={`text-[#c09748] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="border-t border-[#f2f2f3] bg-[#fafafb] p-5 text-xs sm:text-sm text-[#777b86] leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 8: Download Catalogue */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

    </div>
  );
};
