import React from 'react';
import { PageBanner } from '../components/PageBanner';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { CheckCircle2, Sliders, Settings } from 'lucide-react';

interface InjectionMoldingProps {
  navigateTo: (page: string) => void;
}

export const InjectionMolding: React.FC<InjectionMoldingProps> = ({ navigateTo }) => {
  const advantages = [
    { title: "In-House Tool & Mold Design", text: "We draft and assemble custom high-carbon steel molds in-house using CNC machining, accelerating prototype-to-production turnaround." },
    { title: "Engineering Polymer Mastery", text: "Continuous moulding of high-pressure engineering ABS, Polycarbonate, Nylon (PA6/66), PMMA, and high-impact Polypropylenes." },
    { title: "High-Tonnage Precision Ejection", text: "Multi-tonnage injection moulding machines maintaining strict dimensional tolerances, preventing sink marks, weld lines, and flash." },
    { title: "Turnkey One-Roof Manufacturing", text: "Combining precision plastic molding and decorative surface coatings under one roof eliminates transit handling scuffs and vendor sprawl." }
  ];

  const processSteps = [
    { step: "01", name: "CAD Tool Design & DFM", desc: "Collaborative drafting of tooling parameters with mold-flow simulation to eliminate sink marks and air traps." },
    { step: "02", name: "CNC Mold Machining", desc: "Precision EDM and vertical CNC milling of core/cavity inserts using hardened P20 and H13 tool steel." },
    { step: "03", name: "Granule Melt Injection", desc: "Dehumidified polymer granules melted under PID-controlled heat and injected into high-clamp molds." },
    { step: "04", name: "Conformal Cooling", desc: "Balanced water cooling circuits rapidly solidify the element, followed by automated ejector pin release." },
    { step: "05", name: "Degating & Inline QC", desc: "Precision gate trimming and dimensional coordinate verification before transferring directly to the paint cleanroom." }
  ];

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132870/paintking/home/hero_slider/paintking-hero-slide-9.webp"
        title="Custom Plastic Injection Moulding" 
        subtitle="End-to-end tooling design, precision thermoplastic moulding, and high-volume B2B component manufacturing under one roof."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Our Services', pageId: 'services' }, { label: 'Injection Molding', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Overview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          
          <div className="lg:col-span-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Substrate Engineering</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2 leading-tight">
              High-Precision Thermoplastic Injection Moulding
            </h2>
            <div className="mt-4 h-0.5 w-12 bg-[#c09748] rounded-full" />

            <p className="mt-6 text-[#777b86] text-[15px] leading-relaxed">
              Before a component receives an impeccable liquid spray, metallic finish, or wood-grain immersion, it must be molded with zero dimensional deviation. PaintKing operates a dedicated injection molding department that supplies substrate parts directly into our coating lines.
            </p>
            <p className="mt-4 text-[#777b86] text-[15px] leading-relaxed">
              We leverage multi-tonnage hydraulic and all-electric presses to mold high-stress structural components, including automotive dashboards, switchplates, electronics bezels, and appliance housings. By housing tooling design and coatings in one facility, we preserve total quality control.
            </p>

            <div className="mt-6 p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec] flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center font-bold text-sm shrink-0">
                <Settings size={18} className="text-[#c09748]" />
              </div>
              <div className="text-xs text-[#777b86]">
                <span className="text-[#17191c] block font-semibold uppercase tracking-wider mb-0.5">Machine Tonnage Fleet:</span>
                From 80 Tons up to 450 Tons clamping capacity, serving thin-wall switchplates and heavy industrial shells.
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => navigateTo('contact')}
                className="pill-btn-filled text-sm cursor-pointer"
              >
                Request Tooling Consultation →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 overflow-hidden rounded-[24px] border border-[#ececec] shadow-sm h-[320px] sm:h-[450px] bg-[#17191c]">
            <img 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" 
              alt="Moulding plastic housings and switches" 
              className="h-full w-full object-cover filter saturate-110 brightness-95"
            />
          </div>

        </div>
      </section>

      {/* SECTION 3: Advantages */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Production Value</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Advantages of Turnkey In-House Moulding</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((adv) => (
              <div key={adv.title} className="p-7 rounded-[24px] bg-white border border-[#ececec] flex flex-col justify-between shadow-xs hover:border-[#c09748]/50 transition-all duration-300">
                <div>
                  <div className="h-8 w-8 rounded-full bg-[#faf3e0] text-[#8a6521] flex items-center justify-center font-bold text-xs mb-4">
                    ✓
                  </div>
                  <h3 className="text-base font-serif text-[#17191c]">{adv.title}</h3>
                  <p className="text-[#777b86] text-xs sm:text-sm mt-2 leading-relaxed">
                    {adv.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: 5-step process timeline */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Manufacturing Pipeline</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">
            The 5-Step Injection Moulding Pipeline
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {processSteps.map((step) => (
            <div key={step.step} className="p-6 rounded-[24px] bg-white border border-[#ececec] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-3xl font-serif text-[#c09748] block">{step.step}</span>
                <h3 className="text-sm font-semibold text-[#17191c] mt-3">{step.name}</h3>
                <p className="text-[#777b86] text-[12px] leading-relaxed mt-2">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Download catalog */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

    </div>
  );
};
