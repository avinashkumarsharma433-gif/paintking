import React from 'react';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  breadcrumbs: { label: string; active?: boolean; pageId?: string }[];
  navigateTo?: (page: string) => void;
  bgImage?: string;
}

export const PageBanner: React.FC<PageBannerProps> = ({ 
  title, 
  subtitle, 
  breadcrumbs, 
  navigateTo,
  bgImage = "https://res.cloudinary.com/lqmdr4jt/image/upload/v1787131947/paintking/spray_painting/facility_and_qc/spray-painting-process-paintking.webp"
}) => {
  return (
    <section className="relative overflow-hidden bg-[#17191c] text-white min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] flex items-center justify-center border-b border-[#ececec]">
      {/* Background Large Hero Image */}
      <img 
        src={bgImage} 
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center filter brightness-90 saturate-105 scale-100 transform transition-transform duration-1000"
      />

      {/* Luxury Cinematic Gradient & Lighting Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 z-10" />
      <div className="absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-[#c09748]/15 blur-[120px] pointer-events-none z-10" />

      <div className="relative z-20 mx-auto max-w-4xl px-4 py-16 sm:py-20 text-center">
        {/* Breadcrumbs Navigation */}
        <nav className="mb-4 inline-flex items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-md">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {crumb.active ? (
                <span className="text-[#faf3e0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]"></span>
                  <span>{crumb.label}</span>
                </span>
              ) : (
                <button
                  onClick={() => crumb.pageId && navigateTo && navigateTo(crumb.pageId)}
                  className="hover:text-white text-gray-300 cursor-pointer transition-colors"
                >
                  {crumb.label}
                </button>
              )}
              {idx < breadcrumbs.length - 1 && <span className="text-gray-400 select-none">/</span>}
            </React.Fragment>
          ))}
        </nav>

        {/* Title / Header - Newsreader / Source Serif */}
        <h1 
          className="text-3xl font-serif text-white sm:text-5xl lg:text-6xl tracking-tight leading-[1.18] font-normal"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6)' }}
        >
          {title}
        </h1>

        {/* Optional Subtitle */}
        {subtitle && (
          <p 
            className="mx-auto mt-4 max-w-2xl text-[14px] sm:text-[16px] text-gray-200 font-normal leading-relaxed"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {subtitle}
          </p>
        )}

        <div className="mx-auto mt-6 h-0.5 w-14 rounded-full bg-[#c09748] shadow-md" />
      </div>
    </section>
  );
};
