import React from 'react';
import { PageBanner } from '../components/PageBanner';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface DigitalPrintingProps {
  navigateTo: (page: string) => void;
}

export const DigitalPrinting: React.FC<DigitalPrintingProps> = ({ navigateTo }) => {
  const advantages = [
    { title: "Instant UV-LED Photopolymerization", text: "Instant UV exposure hardens prints immediately without oven baking. Highly resistant to alcohol wiping, scratching, oils, and moisture." },
    { title: "Photographic Color & Micro-Text", text: "Delivering razor-sharp typography down to 4pt font, micro circuit diagrams, barcode identifiers, and vibrant CMYK+White color fidelity." },
    { title: "Direct-to-Substrate Versatility", text: "Direct printing onto pre-molded plastics (ABS/PC), glass fascias, anodized aluminum plates, acrylic control panels, and metal stampings." },
    { title: "Tactile Relief & Spot Gloss", text: "Supports layer-on-layer ink deposition to build tactile 3D relief texturing, raised braille symbols, and selective spot varnish highlights." }
  ];

  const processSteps = [
    { num: "01", name: "Substrate Pre-Treatment", text: "Thorough wiping of parts using corona/flame pre-treatment or specialized chemical primers to ensure optimum surface wetting." },
    { num: "02", name: "Vacuum Bed Alignment", text: "Parts secured onto precision multi-cavity jigs on the flatbed vacuum table with micro optical camera registration." },
    { num: "03", name: "Piezo Jetting & UV Cure", text: "Industrial grayscale printheads deposit pigment drops while synchronized UV-LED arrays cure the ink instantly." },
    { num: "04", name: "Adhesion & Cross-Hatch QC", text: "Rigorous diagnostic inspection verifying optical density, line crispness, and ASTM cross-hatch adhesion." },
    { num: "05", name: "Scratchproof Protective Film", text: "Application of protective peel-off masking films before container packing to prevent scuffs during OEM assembly." }
  ];

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787131945/paintking/spray_painting/facility_and_qc/digital-printing-services-in-mumbai.webp"
        title="Industrial UV Digital Flatbed Printing" 
        subtitle="Direct-to-substrate printing onto engineering plastics and metals using instant ultraviolet light curing inks."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Our Services', pageId: 'services' }, { label: 'Digital Printing', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Overview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          
          <div className="lg:col-span-5 overflow-hidden rounded-[24px] border border-[#ececec] shadow-sm h-[320px] sm:h-[450px] bg-[#17191c]">
            <img 
               src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=800" 
               alt="UV digital printed switch covers" 
               className="h-full w-full object-cover filter saturate-110 brightness-95"
            />
          </div>

          <div className="lg:col-span-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Direct Flatbed Decoration</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2 leading-tight">
              High-Precision Direct UV Printing
            </h2>
            <div className="mt-4 h-0.5 w-12 bg-[#c09748] rounded-full" />

            <p className="mt-6 text-[#777b86] text-[15px] leading-relaxed">
              UV digital printing is an advanced direct-to-substrate decoration technology. It utilizes specialized piezoelectric inkjet printheads to spray UV-reactive polymer inks onto rigid substrates, which cure immediately under synchronized UV-LED arrays.
            </p>
            <p className="mt-4 text-[#777b86] text-[15px] leading-relaxed">
              Because this represents a digital-to-surface workflow, it eliminates traditional screen manufacturing, photographic films, and block engraving. This allows PaintKing to execute multi-colored legends, variable serialization, and warning graphics on demand with minimal lead time.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3.5">
              <div className="flex items-center gap-2 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Zero Screen Setup Costs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Instant LED Photopolymerization</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Tactile Embossed Relief Ink</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#17191c]">
                <CheckCircle2 className="text-[#c09748] shrink-0" size={16} />
                <span>Opaque White Underbase Printing</span>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => navigateTo('contact')}
                className="pill-btn-filled text-sm cursor-pointer"
              >
                Request Digital Print Proofs →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: Advantages */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Production Advantages</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Why Choose UV Direct Printing</h2>
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

      {/* SECTION 4: Process */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Process Protocol</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">
            The 5-Step UV Plotting Protocol
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {processSteps.map((step) => (
            <div key={step.num} className="p-6 rounded-[24px] bg-white border border-[#ececec] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-3xl font-serif text-[#c09748] block">{step.num}</span>
                <h3 className="text-sm font-semibold text-[#17191c] mt-3">{step.name}</h3>
                <p className="text-[#777b86] text-[12px] leading-relaxed mt-2">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Download Catalogue Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

    </div>
  );
};
