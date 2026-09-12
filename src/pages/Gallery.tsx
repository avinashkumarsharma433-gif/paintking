import React, { useState } from 'react';
import { galleryItems } from '../data';
import { PageBanner } from '../components/PageBanner';
import { X, Maximize2, Filter } from 'lucide-react';

interface GalleryProps {
  navigateTo: (page: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ navigateTo }) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Spray Painting' | 'Hydrographic Printing' | 'Digital Printing' | 'Injection Molding'>('All');
  const [lightboxItem, setLightboxItem] = useState<(typeof galleryItems)[0] | null>(null);

  const filterButtons: ('All' | 'Spray Painting' | 'Hydrographic Printing' | 'Digital Printing' | 'Injection Molding')[] = [
    'All', 'Spray Painting', 'Hydrographic Printing', 'Digital Printing', 'Injection Molding'
  ];

  const displayedItems = activeFilter === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132868/paintking/home/hero_slider/paintking-hero-slide-6.webp"
        title="Surface Finishing Gallery" 
        subtitle="Explore our visual portfolio of completed B2B components, detailing premium spray coats, 3D hydro dips, and flatbed UV direct prints."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Gallery', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Filter Panel */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-b border-[#ececec]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#777b86]">
            <Filter size={15} className="text-[#c09748]" />
            <span>Filter Division:</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {filterButtons.map((btn) => (
              <button
                key={btn}
                onClick={() => setActiveFilter(btn)}
                className={`pill-btn text-xs font-medium px-4 py-2 cursor-pointer transition-all ${
                  activeFilter === btn 
                    ? 'bg-[#17191c] text-white' 
                    : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:text-[#17191c]'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Gallery Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {displayedItems.length === 0 ? (
          <div className="text-center py-20 bg-[#fafafb] rounded-[24px] border border-[#ececec]">
            <p className="text-sm text-[#777b86]">No portfolio items found in this section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {displayedItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => setLightboxItem(item)}
                className="group relative overflow-hidden rounded-[20px] border border-[#ececec] bg-[#17191c] h-80 cursor-pointer shadow-xs hover:border-[#c09748]/50 hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                <img 
                  src={item.image} 
                  alt={item.alt} 
                  className="h-full w-full object-cover filter saturate-110 brightness-95 group-hover:scale-105 duration-500"
                />

                {/* Dark Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#17191c]/90 via-[#17191c]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5" />

                {/* Always-on Tag */}
                <span className="absolute top-3 left-3 z-30 bg-black/70 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10">
                  {item.category}
                </span>

                {/* Hover Content */}
                <div className="absolute inset-x-0 bottom-0 z-40 p-5 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <h3 className="text-sm font-serif text-white">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c09748] mt-2">
                    <Maximize2 size={12} />
                    <span>Enlarge Spec</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center text-xs text-[#979799] tracking-wider uppercase">
          Displaying {displayedItems.length} certified industrial coating and immersion series specimens.
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      {lightboxItem && (
        <div 
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <button 
            onClick={() => setLightboxItem(null)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-[#c09748] transition-colors cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X size={18} />
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full rounded-[24px] overflow-hidden bg-white border border-[#ececec] shadow-2xl p-6 flex flex-col gap-4"
          >
            <div className="relative aspect-video rounded-[16px] overflow-hidden bg-[#17191c]">
              <img 
                src={lightboxItem.image} 
                alt={lightboxItem.alt} 
                className="h-full w-full object-cover saturate-115"
              />
              <span className="absolute top-3.5 left-3.5 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                {lightboxItem.category}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-serif text-[#17191c]">
                {lightboxItem.title}
              </h3>
              <p className="text-xs text-[#777b86] mt-2 leading-relaxed">
                Processed inside PaintKing's Dust-Free Clean Environment enclosures with ASTM 5B adhesion certification.
              </p>
            </div>
            
            <div className="border-t border-[#f2f2f3] pt-4 flex gap-3 justify-end items-center">
              <button 
                onClick={() => {
                  setLightboxItem(null);
                  navigateTo('contact');
                }}
                className="pill-btn-gold text-xs !py-2.5 !px-5 cursor-pointer"
              >
                Request Sample Slab →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
