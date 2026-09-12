import React, { useState, useEffect } from 'react';
import { finishTypes, clientLogos, testimonials } from '../data';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ArrowRight, Star, Quote, Award, ShieldCheck, Zap, HeartHandshake, MapPin, Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight, Settings, CheckCircle2, Factory, Users, FileText, FlaskConical, PackageCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeProps {
  navigateTo: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ navigateTo }) => {
  // Hero Carousel Index (1 to 12 slides)
  const [heroIndex, setHeroIndex] = useState(0);
  const heroSlides = [
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132863/paintking/home/hero_slider/beauty-product-bottle-1.webp",
        "tag": "Cosmetics Packaging",
        "title": "Luxury Liquid Coating & Gradient Finishes"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132864/paintking/home/hero_slider/car-handles-hydrographic-printed-image-1.webp",
        "tag": "Automotive Components",
        "title": "Carbon Fiber & Wood Hydro Dipping"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132865/paintking/home/hero_slider/hydrographic-printed-fan-blade-5.webp",
        "tag": "Home Appliances",
        "title": "3D Immersion Dipping on Aerodynamic Blades"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132865/paintking/home/hero_slider/hydrographic-printing-on-ac-panel.webp",
        "tag": "Consumer Electronics",
        "title": "Precision Bezel & AC Panel Surface Coatings"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132866/paintking/home/hero_slider/hydrographic-prints-on-shoes-2.webp",
        "tag": "Footwear & Lifestyle",
        "title": "Curvature-Conforming Hydrographic Dipping"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132867/paintking/home/hero_slider/paintking-hero-slide-11.webp",
        "tag": "Certified Non-Toxic",
        "title": "Child-Safe RoHS Compliant Finishing"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132868/paintking/home/hero_slider/paintking-hero-slide-6.webp",
        "tag": "Pristine Cleanrooms",
        "title": "Dust-Free Dust-Free Liquid Coating"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132868/paintking/home/hero_slider/paintking-hero-slide-7.webp",
        "tag": "Tactile Velvet Finishes",
        "title": "Soft-Touch Rubberized Polymer Coatings"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132869/paintking/home/hero_slider/paintking-hero-slide-8.webp",
        "tag": "Direct UV Flatbed",
        "title": "Micro-Registration UV Digital Graphics"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132870/paintking/home/hero_slider/paintking-hero-slide-9.webp",
        "tag": "Turnkey Tooling",
        "title": "Engineering-Grade Injection Molding"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132871/paintking/home/hero_slider/spray-painting-electrical-switches.webp",
        "tag": "Electrical Switchgear",
        "title": "Modular Switchplate & Bezel Coating"
    },
    {
        "image": "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132871/paintking/home/hero_slider/spray-painting-on-electrical-switches.webp",
        "tag": "Electrical Switchgear",
        "title": "High-Gloss & Matte Switch Enclosures"
    }
];

  // Animated integers
  const [statYears, setStatYears] = useState(0);
  const [statLocations, setStatLocations] = useState(0);
  const [statTeams, setStatTeams] = useState(0);
  const [statCapacity, setStatCapacity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatYears(prev => (prev < 30 ? prev + 1 : 30));
      setStatLocations(prev => (prev < 4 ? prev + 1 : 4));
      setStatTeams(prev => (prev < 250 ? prev + 8 : 250));
      setStatCapacity(prev => (prev < 100000 ? prev + 2500 : 100000));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [heroSlides.length]);

  const getLogoDisplayUrl = (url: string, name: string) => {
    if (!url) return `https://placehold.co/200x80/FAF9F5/1E293B?font=inter&text=${encodeURIComponent(name)}`;
    return url;
  };

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* ----------------- SECTION 1: EDITORIAL HERO ----------------- */}
      <section 
        onTouchStart={(e) => {
          (window as any)._touchStartX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const startX = (window as any)._touchStartX;
          if (startX !== undefined) {
            const diffX = startX - e.changedTouches[0].clientX;
            if (diffX > 45) {
              setHeroIndex((prev) => (prev + 1) % heroSlides.length);
            } else if (diffX < -45) {
              setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
            }
          }
        }}
        className="relative w-full aspect-[16/9] min-h-[520px] sm:min-h-[600px] lg:min-h-[720px] max-h-[90vh] overflow-hidden bg-black text-white flex items-end select-none touch-pan-y"
      >
        {/* Background Image Carousel (16:9 ratio, natural bright images) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-64 sm:h-80 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10 pointer-events-none" />
          <AnimatePresence mode="sync">
            <motion.img 
              key={heroIndex}
              src={heroSlides[heroIndex].image} 
              alt={heroSlides[heroIndex].title} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />
          </AnimatePresence>
        </div>

        {/* Left Side Click Area for Instant Slide Back (Desktop/Tablet) */}
        <div 
          onClick={() => setHeroIndex(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
          className="hidden sm:block absolute inset-y-0 left-0 w-1/4 z-10 cursor-w-resize hover:bg-white/[0.02] transition-colors"
          title="Click to view previous slide"
        />

        {/* Right Side Click Area for Instant Slide Next (Desktop/Tablet) */}
        <div 
          onClick={() => setHeroIndex(prev => (prev + 1) % heroSlides.length)}
          className="hidden sm:block absolute inset-y-0 right-0 w-1/4 z-10 cursor-e-resize hover:bg-white/[0.02] transition-colors"
          title="Click to view next slide"
        />

        {/* Content Container positioned at the bottom */}
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16 pt-24 w-full pointer-events-none">
          <div className="max-w-2xl pointer-events-auto">
            <AnimatePresence mode="wait">
              <motion.div 
                key={heroIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#faf3e0] border border-white/20 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]"></span>
                  <span>{heroSlides[heroIndex].tag}</span>
                </div>

                <h1 
                  className="mt-2.5 sm:mt-3 text-xl sm:text-4xl lg:text-5xl font-serif text-white tracking-tight leading-[1.2]"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)' }}
                >
                  {heroSlides[heroIndex].title}
                </h1>

                <p 
                  className="mt-2 text-[11px] sm:text-sm text-gray-100 max-w-xl font-normal leading-relaxed line-clamp-2 sm:line-clamp-none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)' }}
                >
                  India's foremost B2B facility for high-volume automated spray painting, 3D water submersion, direct UV printing, and custom tooling with Dust-Free Clean Environment precision.
                </p>

                {/* Buttons in single balanced horizontal line on mobile, full original size on desktop */}
                <div className="mt-3.5 sm:mt-5 flex flex-row items-center gap-2 sm:gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('contact');
                    }}
                    className="pill-btn-gold !py-1.5 !px-3.5 sm:!py-2.5 sm:!px-6 text-[11px] sm:text-sm cursor-pointer flex items-center gap-1.5 shadow-lg whitespace-nowrap"
                  >
                    <span>Request B2B Quote</span>
                    <span className="text-[10px] sm:text-xs">→</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('services');
                    }}
                    className="pill-btn-ghost !border-white/40 !bg-black/50 backdrop-blur-md !text-white hover:!bg-white/20 !py-1.5 !px-3 sm:!py-2.5 sm:!px-5 text-[11px] sm:text-sm cursor-pointer shadow-md whitespace-nowrap"
                  >
                    Explore Capabilities
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel Slide Left/Right Controls (Hidden on mobile, visible on tablet & desktop) */}
        <div className="hidden sm:flex absolute right-6 sm:right-8 bottom-6 sm:bottom-8 z-30 items-center gap-2 pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setHeroIndex(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1));
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 backdrop-blur-md text-white hover:bg-[#c09748] hover:text-white hover:border-[#c09748] transition-all cursor-pointer shadow-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setHeroIndex(prev => (prev === heroSlides.length - 1 ? 0 : prev + 1));
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 backdrop-blur-md text-white hover:bg-[#c09748] hover:text-white hover:border-[#c09748] transition-all cursor-pointer shadow-md"
            aria-label="Next Slide"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Slide Indicator Dots */}
        <div className="absolute left-6 sm:left-8 bottom-6 sm:bottom-8 z-30 flex gap-1.5 sm:gap-2 pointer-events-auto">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setHeroIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === heroIndex ? 'w-6 sm:w-8 bg-[#c09748]' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ----------------- SECTION 2: OUR SERVICES ----------------- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Core Capabilities</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2 tracking-tight">Four Specialised Coating Divisions</h2>
            <p className="mt-4 text-[15px] text-[#777b86]">From micrometric spray lines to complex 3D immersion wraps and industrial flatbed UV cures.</p>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            
            {/* Service 1: Spray Painting */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              onClick={() => navigateTo('spray-painting')}
              className="group relative aspect-square sm:aspect-[16/11] lg:aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-[#17191c] border border-[#ececec] shadow-md hover:shadow-2xl hover:border-[#c09748]/60 transition-all duration-500 cursor-pointer"
            >
              {/* Background Image */}
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134546/paintking/home/services_preview/paintking-service-spray-painting-card.webp" 
                alt="Liquid spray painting"
                className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Low-profile Bottom Gradient Overlay with Minimalist Typography */}
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-6 px-6 sm:px-8 flex flex-col justify-end">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-white group-hover:text-[#faf3e0] transition-colors drop-shadow-md font-medium">
                  Spray Painting
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-1 line-clamp-2 drop-shadow max-w-xl">
                  Conveyorized liquid and tactile soft-feel finishes applied in pressurized cleanrooms for automotive and appliance components.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#c09748] group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore Division</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>

            {/* Service 2: Hydrographic Printing */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={() => navigateTo('hydrographic')}
              className="group relative aspect-square sm:aspect-[16/11] lg:aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-[#17191c] border border-[#ececec] shadow-md hover:shadow-2xl hover:border-[#c09748]/60 transition-all duration-500 cursor-pointer"
            >
              {/* Background Image */}
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134547/paintking/home/services_preview/paintking-service-hydrographic-dipping-card.webp" 
                alt="Hydrographic dipping"
                className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Low-profile Bottom Gradient Overlay with Minimalist Typography */}
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-6 px-6 sm:px-8 flex flex-col justify-end">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-white group-hover:text-[#faf3e0] transition-colors drop-shadow-md font-medium">
                  Hydrographic Printing
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-1 line-clamp-2 drop-shadow max-w-xl">
                  Seamless 3D water-transfer wrapping for carbon fiber, mahogany timber grains, and geometric textures on complex parts.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#c09748] group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore Division</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>

            {/* Service 3: Digital Printing */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              onClick={() => navigateTo('digital')}
              className="group relative aspect-square sm:aspect-[16/11] lg:aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-[#17191c] border border-[#ececec] shadow-md hover:shadow-2xl hover:border-[#c09748]/60 transition-all duration-500 cursor-pointer"
            >
              {/* Background Image */}
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134548/paintking/home/services_preview/paintking-service-digital-uv-printing-card.webp" 
                alt="Direct UV flatbed printed panels"
                className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Low-profile Bottom Gradient Overlay with Minimalist Typography */}
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-6 px-6 sm:px-8 flex flex-col justify-end">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-white group-hover:text-[#faf3e0] transition-colors drop-shadow-md font-medium">
                  Digital UV Printing
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-1 line-clamp-2 drop-shadow max-w-xl">
                  Direct-to-substrate UV cured graphics on plastics, glass, metals, and acrylics with tactile embossing and white base layers.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#c09748] group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore Division</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>

            {/* Service 4: Injection Molding */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => navigateTo('injection-molding')}
              className="group relative aspect-square sm:aspect-[16/11] lg:aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-[#17191c] border border-[#ececec] shadow-md hover:shadow-2xl hover:border-[#c09748]/60 transition-all duration-500 cursor-pointer"
            >
              {/* Background Image */}
              <img 
                src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787134549/paintking/home/services_preview/paintking-service-injection-moulding-card.webp" 
                alt="Industrial Plastic Components Moulding"
                className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Low-profile Bottom Gradient Overlay with Minimalist Typography */}
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-6 px-6 sm:px-8 flex flex-col justify-end">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-white group-hover:text-[#faf3e0] transition-colors drop-shadow-md font-medium">
                  Injection Moulding
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-1 line-clamp-2 drop-shadow max-w-xl">
                  Integrated tool design and plastic molding under one roof, producing custom ABS, PC, and nylon components ready for immediate coating.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#c09748] group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore Division</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ----------------- SECTION 3: BEFORE & AFTER TRANSFORMATION ----------------- */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <BeforeAfterSlider />
        </div>
      </section>

      {/* ----------------- SECTION 4: 14 SIGNATURE FINISHES SHOWCASE ----------------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Editorial Palette</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Signature Industrial Finishes</h2>
          <p className="mt-4 text-[15px] text-[#777b86]">Standardized finish library ready for immediate specification and sampling.</p>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {finishTypes.slice(0, 8).map((f) => (
            <div key={f.id} className="group rounded-[24px] border border-[#ececec] bg-white overflow-hidden hover:border-[#c09748]/50 hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="relative h-44 overflow-hidden bg-[#17191c]">
                <img src={f.image} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
                  {f.number}
                </span>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-[16px] text-[#17191c] group-hover:text-[#c09748] transition-colors">{f.name}</h4>
                  <p className="mt-2 text-[12px] text-[#777b86] leading-relaxed line-clamp-3">{f.description}</p>
                </div>
                <button 
                  onClick={() => navigateTo('gallery')}
                  className="mt-4 text-xs font-semibold text-[#c09748] hover:underline text-left cursor-pointer"
                >
                  View Sample Specs →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => navigateTo('gallery')}
            className="pill-btn-ghost text-sm cursor-pointer"
          >
            Explore All 14 Finishes in Gallery →
          </button>
        </div>
      </section>

      {/* ----------------- SECTION 5: HOW WE WORK (CLIENT ENGAGEMENT & SAMPLING WORKFLOW) ----------------- */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Client Partnership Model</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">How We Work With You</h2>
            <p className="mt-4 text-[15px] text-[#777b86]">
              From your initial component brief to custom R&D formulation and pre-production sample approval before mass manufacturing begins.
            </p>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                tag: "Step 1",
                icon: FileText,
                title: "Requirement & Component Brief",
                desc: "You share your raw component, 3D CAD design, target finish expectations, and required durability or environmental specifications with our engineering team."
              },
              {
                step: "02",
                tag: "Step 2",
                icon: FlaskConical,
                title: "In-House R&D & Custom Prototyping",
                desc: "Our chemical engineers and finish technicians develop tailored 2K formulas, custom PVA hydrographic alignments, or UV tooling matching your exact requirements."
              },
              {
                step: "03",
                tag: "Step 3",
                icon: PackageCheck,
                title: "Sample Coupon & Pilot Delivery",
                desc: "We produce and dispatch physical finished sample coupons or pilot coated parts to your facility for tactile inspection, aesthetic sign-off, and lab testing."
              },
              {
                step: "04",
                tag: "Step 4",
                icon: CheckCircle2,
                title: "Final Approval & Mass Production",
                desc: "Once you officially approve the sample quality, we lock the master recipe and scale up high-volume production with guaranteed batch-to-batch consistency."
              }
            ].map((p, idx) => {
              const IconComponent = p.icon;
              return (
                <div 
                  key={idx} 
                  className="rounded-[24px] bg-white border border-[#ececec] p-7 flex flex-col justify-between hover:border-[#c09748]/50 shadow-xs hover:shadow-lg transition-all duration-300 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold text-[#c09748]">
                          {p.step}
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#faf3e0] text-[#c09748] border border-[#f4e5be] group-hover:scale-110 group-hover:bg-[#c09748] group-hover:text-white transition-all duration-300">
                          <IconComponent size={17} />
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                        {p.tag}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-[#17191c] mt-5 group-hover:text-[#c09748] transition-colors leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#777b86] mt-3 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f2f2f3] flex items-center gap-1.5 text-[11px] font-semibold text-[#17191c] group-hover:text-[#c09748] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]"></span>
                    <span>{idx === 2 ? 'Zero Risk to Client' : idx === 3 ? '100% Locked Spec' : 'Engineering Review'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 7: DOWNLOAD BROCHURE ----------------- */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

      {/* ----------------- SECTION 8: WHY CHOOSE US? (STATS) ----------------- */}
      <section className="relative overflow-hidden bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
            
            {/* Context Left */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Manufacturing Heritage</span>
              <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2 leading-tight">
                Why Industry Leaders Partner With Us
              </h2>
              <p className="mt-6 text-[#777b86] text-[15px] leading-relaxed">
                With a solid foundation of thirty-plus years in complex surface technology, we serve as a reliable Tier-1 B2B extension to manufacturing firms across the nation. We operate four high-capacity units equipped with fully cleanroom-pressurized enclosures to guarantee zero dust inclusions.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => navigateTo('about')}
                  className="pill-btn-filled text-sm cursor-pointer"
                >
                  Our Heritage & Plants →
                </button>
              </div>
            </motion.div>

            {/* Counts Right Grid (4 cards with icons) */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              
              <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#ececec] text-center shadow-xs flex flex-col items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf3e0] text-[#c09748] mb-3 border border-[#f4e5be]">
                  <Award size={18} />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#17191c]">
                  {statYears}<span className="text-[#c09748]">+</span>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#979799] mt-2">
                  Years of Industry Leadership
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#ececec] text-center shadow-xs flex flex-col items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf3e0] text-[#c09748] mb-3 border border-[#f4e5be]">
                  <Factory size={18} />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#17191c]">
                  {statLocations}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#979799] mt-2">
                  State-of-the-Art Plant Units
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#ececec] text-center shadow-xs flex flex-col items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf3e0] text-[#c09748] mb-3 border border-[#f4e5be]">
                  <Users size={18} />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#17191c]">
                  {statTeams}<span className="text-[#c09748]">+</span>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#979799] mt-2">
                  Engineers & Finish Specialists
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#ececec] text-center shadow-xs flex flex-col items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf3e0] text-[#c09748] mb-3 border border-[#f4e5be]">
                  <Zap size={18} />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#17191c]">
                  {statCapacity.toLocaleString()}<span className="text-[#c09748]">+</span>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#979799] mt-2">
                  Daily Coated Part Capacity
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ----------------- SECTION 9: INDUSTRIES & APPLICATIONS GRID ----------------- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#ececec]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Sector Specialization</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Industries Engineered For Precision</h2>
            <p className="mt-4 text-[15px] text-[#777b86]">
              Delivering high-durability surface coatings certified against automotive, electrical, and consumer appliance performance standards.
            </p>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Electrical Switchgear & Modular Plates",
                spec: "Flame Retardant UL94 V0 Coating",
                desc: "High-gloss piano black, brushed gold, and soft-touch matte switch plates designed for 100,000+ finger actuations without wear.",
                tag: "Electricals"
              },
              {
                title: "Automotive Trim & Interior Bezels",
                spec: "Class A Automotive Weatherability",
                desc: "Carbon-fiber hydrographic console wraps, air vents, door handles, and exterior mirror housings with high-temp clear coats.",
                tag: "Automotive"
              },
              {
                title: "Home Appliances & Air Coolers",
                spec: "UV Anti-Yellowing 2K Lacquer",
                desc: "Immersion dipping and direct UV flatbed graphics on front panels, fan blades, refrigerator door trims, and AC consoles.",
                tag: "Appliances"
              },
              {
                title: "Luxury Cosmetics & Perfume Packaging",
                spec: "Chemical & Alcohol Resistant",
                desc: "Gradient liquid spray transitions, metallic electroplated effects, and luxury tactile velvet finishes on plastic and glass caps.",
                tag: "Cosmetics"
              },
              {
                title: "Consumer Electronics & Audio",
                spec: "Anti-Fingerprint & ESD Safe",
                desc: "Smart speaker grilles, earphone charging cases, remote controllers, and POS terminals with scratch-resistant micro-coatings.",
                tag: "Electronics"
              },
              {
                title: "Footwear & Ergonomic Lifestyle Goods",
                spec: "Flex-Resistant Hydrographics",
                desc: "Complex curvature dipping on shoe midsoles, ergonomic chair armrests, and sports equipment with crack-proof flexible clears.",
                tag: "Lifestyle"
              }
            ].map((ind, idx) => (
              <div key={idx} className="rounded-[24px] border border-[#ececec] bg-[#fafafb] p-7 hover:border-[#c09748]/50 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be]">
                    {ind.tag}
                  </span>
                  <h3 className="font-serif text-lg text-[#17191c] mt-3">{ind.title}</h3>
                  <span className="inline-block text-[11px] font-semibold text-[#c09748] mt-1">{ind.spec}</span>
                  <p className="text-xs text-[#777b86] mt-2.5 leading-relaxed">{ind.desc}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#ececec]">
                  <button 
                    onClick={() => navigateTo('contact')}
                    className="text-xs font-semibold text-[#17191c] hover:text-[#c09748] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Request Industry Spec Sheet</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 10: CLIENT LOGOS (INFINITE AUTO-SCROLL CAROUSEL) ----------------- */}
      <section className="border-b border-[#ececec] py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Corporate Partnerships</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#17191c] mt-2">Trusted By OEM & Tier-1 Giants</h2>
            <p className="mt-3 text-[14px] text-[#777b86]">
              Supplying critical surface finishes to India's leading consumer electronic, electrical switchgear, and automotive corporations.
            </p>
          </div>

          {/* Marquee Carousel Container with Gradient Edge Masks */}
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <motion.div 
              className="flex gap-4 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                duration: 35,
                ease: 'linear',
                repeat: Infinity,
              }}
              whileHover={{ animationPlayState: 'paused' }}
            >
              {/* Duplicate array twice for seamless infinite loop */}
              {[...clientLogos, ...clientLogos].map((logo, idx) => (
                <div 
                  key={idx}
                  className="w-[calc(50vw-2rem)] sm:w-[calc(33.333vw-2rem)] lg:w-[280px] shrink-0 flex items-center justify-center p-6 rounded-[20px] bg-[#fafafb] border border-[#ececec] hover:border-[#c09748]/50 hover:bg-white hover:shadow-lg transition-all duration-300 h-32 group select-none"
                >
                  <img
                    src={getLogoDisplayUrl(logo.logoUrl, logo.name)}
                    alt={`${logo.name} logo`}
                    className="max-h-16 sm:max-h-20 w-auto max-w-[88%] object-contain filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-108 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 11: TESTIMONIALS ----------------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Client Endorsements</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Customer Testimonials</h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-[24px] border border-[#ececec] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-[#c09748]/40 transition-all duration-300"
            >
              <div>
                <div className="flex gap-1 text-[#c09748] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-[13px] text-[#17191c] leading-relaxed italic">
                  "{t.text}"
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-[#f2f2f3] pt-4">
                <img 
                  src={t.avatar} 
                  alt={t.reviewer} 
                  className="h-9 w-9 rounded-full border border-[#ececec] object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-[12px] font-semibold text-[#17191c] truncate">
                    {t.reviewer}
                  </h4>
                  <p className="text-[10px] text-[#777b86] truncate">
                    {t.designation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------- SECTION 12: TECHNICAL FAQ (GOOGLE SCHEMA & AEO) ----------------- */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Procurement & Engineering FAQs</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Frequently Asked Questions</h2>
            <p className="mt-4 text-[15px] text-[#777b86]">
              Key technical specifications, sample turn-around timelines, and quality protocols answered.
            </p>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is your standard turn-around time (TAT) for pre-production color sample coupons?",
                a: "For standardized RAL/Pantone color matching or catalog finishes (Sunwood, Soft-Touch, Marble), sample coupons are dispatched within 48 to 72 hours. Custom formulated multi-coat finishes typically require 4 to 5 working days for ASTM 5B adhesion validation."
              },
              {
                q: "What testing protocols do you use to ensure coating durability on plastic substrates?",
                a: "Every batch is inspected via ASTM D3359 Cross-Hatch Adhesion testing (5B rating), MEK Rub Solvent resistance testing, Delta-E spectrophotometer colorimetry (Delta-E < 0.5), and accelerated 500-hour salt spray humidity chamber testing."
              },
              {
                q: "Can you provide turnkey plastic injection moulding and finishing under one roof?",
                a: "Yes. We operate high-tonnage precision injection moulding presses (80T to 450T) alongside our Dust-Free Clean Environment spray lines and hydrographic dipping tanks, eliminating transit scuff risks and multi-vendor overhead."
              },
              {
                q: "What are your Minimum Order Quantities (MOQ) for B2B production runs?",
                a: "We support both prototype/pilot batch production (100 to 500 units) and high-volume mass production (>50,000 parts daily) across our 4 manufacturing facilities in Vapi, Mumbai, Haridwar, and Vasai."
              },
              {
                q: "Are your coatings and finishes RoHS and REACH compliant?",
                a: "Yes. 100% of our liquid coating formulations, UV printing inks, and hydrographic dipping PVA films are non-toxic, lead-free, and fully compliant with RoHS and REACH standards for export to European and North American markets."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group rounded-[20px] bg-white border border-[#ececec] p-6 open:border-[#c09748]/50 shadow-xs transition-all duration-300">
                <summary className="font-serif text-base sm:text-lg text-[#17191c] font-medium cursor-pointer list-none flex justify-between items-center group-hover:text-[#c09748] transition-colors">
                  <span>{faq.q}</span>
                  <span className="text-[#c09748] text-xl font-mono ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-xs sm:text-sm text-[#777b86] leading-relaxed border-t border-[#f2f2f3] pt-4">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 13: EDITORIAL CTA (LIGHT THEME) ----------------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-[24px] bg-[#fafafb] border border-[#ececec] shadow-sm p-8 sm:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#c09748]/10 blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Fast Turnaround Sampling</span>
            <h3 className="text-2xl sm:text-4xl font-serif text-[#17191c] mt-2 leading-tight">
              Ready to Engineer Your Component's Finishing?
            </h3>
            <p className="mt-4 text-[14px] text-[#777b86] leading-relaxed">
              Request free pre-production sample coupons or get a comprehensive quotation within 24 hours.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
            <button 
              onClick={() => navigateTo('contact')}
              className="pill-btn-gold !py-3.5 !px-7 text-sm cursor-pointer shadow-md"
            >
              Get Free Sample / RFQ →
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
