import React from 'react';
import { PageBanner } from '../components/PageBanner';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface HydrographicProps {
  navigateTo: (page: string) => void;
}

export const Hydrographic: React.FC<HydrographicProps> = ({ navigateTo }) => {
  const advantages = [
    { title: "Universal Geometry Coverage", text: "Can be applied seamlessly to virtually any rigid, cleaned substrate including complex injection moldings, woods, metals, and composite structures." },
    { title: "Extensive Pattern Library", text: "Standard and bespoke graphic patterns comprising high-fidelity automotive carbon fiber twill, luxury mahogany burr, tactile marble, and geometric motifs." },
    { title: "Precise Immersion Control", text: "Automated robotic dipping fixtures maintain strict submersion angles and travel speeds, eliminating pattern stretch or seam misalignment." },
    { title: "Extreme Mechanical Durability", text: "Sealed under dual-component automotive clearcoats, protecting patterned surfaces from UV fading, household cleaners, and abrasion." },
    { title: "Photorealistic Aesthetic", text: "Replicating intricate, photorealistic graphics on objects with deep compound contours, inner cavities, and compound drafts." },
    { title: "Cost-Effective Scalability", text: "Eliminates high tooling investments for multi-material injection molding. Ideal for both pre-series prototypes and continuous mass runs." }
  ];

  const processSteps = [
    { num: "01", name: "Ultrasonic Degreasing", text: "Meticulous washing of substrates to remove mold release agents, oils, and ambient dust particles." },
    { num: "02", name: "Surface Abrasion", text: "Controlled micro-abrasion sanding to establish physical mechanical key on polymer surfaces." },
    { num: "03", name: "Color-Matched Basecoat", text: "A specialized primer basecoat matched to harmonize with the target graphic film shade." },
    { num: "04", name: "PVA Film Hydration", text: "Patterned polyvinyl alcohol film positioned flat onto temperature-regulated flotation tanks." },
    { num: "05", name: "Activator Atomization", text: "Precision chemical activator spray liquefies the PVA carrier, releasing floating graphic ink resins." },
    { num: "06", name: "Controlled Submersion", text: "Components submerged through the ink layer at precise vector angles to wrap contours seamlessly." },
    { num: "07", name: "Thermal Washing Rinse", text: "Continuous warm water cascade dissolves all residual gelatinous film backing." },
    { num: "08", name: "Convection Curing", text: "High-airflow thermal convection curing ovens completely dehydrate the component." },
    { num: "09", name: "2K Clear Protective Topcoat", text: "Application of dual-component automotive gloss, satin, or matte polyurethane clearcoat." },
    { num: "10", name: "Optical Inspection QC", text: "Strict checks under standard light booths verifying zero pattern stretch, voids, or inclusions." },
    { num: "11", name: "Protective Packaging", text: "Anti-friction protective sleeves wrap every finished component prior to dispatch." }
  ];

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132864/paintking/home/hero_slider/car-handles-hydrographic-printed-image-1.webp"
        title="Hydrographic Water Transfer Printing" 
        subtitle="3D Submersion dipping technology transferring high-fidelity carbon fiber, luxury timber grains, and custom graphics onto complex contours."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Our Services', pageId: 'services' }, { label: 'Hydrographic Dipping', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Overview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          
          <div className="lg:col-span-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">3D Submersion Engineering</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2 leading-tight">
              Seamless Graphic Wrapping for Complex 3D Profiles
            </h2>
            <div className="mt-4 h-0.5 w-12 bg-[#c09748] rounded-full" />

            <p className="mt-6 text-[#777b86] text-[15px] leading-relaxed">
              Hydrographic printing (also designated as Hydro Dipping or Water Transfer Printing) is a specialized B2B surface finishing technology. It transfers intricate, high-resolution graphics from a water-soluble carrier film directly onto complex three-dimensional components.
            </p>
            <p className="mt-4 text-[#777b86] text-[15px] leading-relaxed">
              Unlike traditional pad or screen printing that cannot navigate compound 3D drafts, our fluid immersion tanks wrap inks 360-degrees around intricate corners. This allows us to apply rich wood grains, aerospace carbon fibers, and bespoke camouflage patterns seamlessly.
            </p>

            <div className="mt-8 p-5 rounded-[20px] bg-[#faf3e0] border border-[#f4e5be] flex items-start gap-3.5">
              <Sparkles size={18} className="text-[#c09748] shrink-0 mt-0.5" />
              <div className="text-xs text-[#8a6521] leading-relaxed">
                <span className="font-semibold block uppercase tracking-wider mb-1 text-[#8a6521]">Common B2B Applications:</span>
                Automotive interior center consoles & dashboard trims, consumer audio bezels, medical handheld devices, luxury packaging caps, and decorative electrical switchplates.
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => navigateTo('contact')}
                className="pill-btn-filled text-sm cursor-pointer"
              >
                Request Custom Film Samples →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 overflow-hidden rounded-[24px] border border-[#ececec] shadow-sm h-[320px] sm:h-[450px] bg-[#17191c]">
            <img 
              src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=800" 
              alt="Hydrographic dipping process" 
              className="h-full w-full object-cover filter saturate-110 brightness-95"
            />
          </div>

        </div>
      </section>

      {/* SECTION 3: Advantages */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Operational Merits</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Why Specify Hydrographic Transfer</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((adv) => (
              <div key={adv.title} className="p-7 rounded-[24px] bg-white border border-[#ececec] shadow-xs flex flex-col justify-between hover:border-[#c09748]/50 transition-all duration-300">
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

      {/* SECTION 4: 11-step process timeline */}
      <section className="mx-auto max-w-[900px] px-4 py-24 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Process Governance</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">The 11-Step Hydrographic Protocol</h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          <p className="mt-4 text-[#777b86] text-xs sm:text-sm max-w-xl mx-auto">
            Review the detailed physical milestones governing our immersion dipping facility.
          </p>
        </div>

        <div className="relative border-l border-[#ececec] ml-4 sm:ml-8 pl-8 space-y-8">
          {processSteps.map((step) => (
            <div key={step.num} className="relative group">
              <div className="absolute -left-[45px] top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#ececec] text-[11px] font-serif text-[#17191c] group-hover:border-[#c09748] group-hover:text-[#c09748] transition-colors">
                {step.num}
              </div>
              <div className="p-6 rounded-[20px] bg-white border border-[#ececec] hover:border-[#c09748]/40 shadow-xs transition-all">
                <h3 className="text-sm font-semibold text-[#17191c]">{step.name}</h3>
                <p className="text-xs text-[#777b86] mt-1.5 leading-relaxed">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Catalogue */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

    </div>
  );
};
