import React from 'react';
import { officeAddresses } from '../data';
import { Phone, Mail, Facebook, Instagram, Linkedin, MapPin, Sparkles } from 'lucide-react';

interface FooterProps {
  navigateTo: (page: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  const quickLinks = [
    { label: 'Home', id: 'home' },
    { label: 'Our Services Hub', id: 'services' },
    { label: 'Spray Painting', id: 'spray-painting' },
    { label: 'Hydrographic Printing', id: 'hydrographic' },
    { label: 'UV Digital Printing', id: 'digital' },
    { label: 'Injection Moulding', id: 'injection-molding' },
    { label: 'Sample Gallery', id: 'gallery' },
    { label: 'Technical Blog', id: 'blog' },
    { label: 'About Us', id: 'about' },
    { label: 'Careers', id: 'careers' },
    { label: 'Contact Us', id: 'contact' }
  ];

  return (
    <footer id="site-footer" className="bg-[#fafafb] text-[#777b86] border-t border-[#ececec]">
      {/* Upper Footer Segment */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="PAINTKING Logo" 
                className="h-10 sm:h-11 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-6 text-[15px] text-[#777b86] leading-relaxed max-w-sm">
              Over 30 years of engineering leadership in high-precision spray painting, 3D hydrographic submersion, direct UV digital printing, and thermoplastic injection molding.
            </p>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                <Sparkles size={12} className="text-[#c09748]" />
                Registered
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer referrer" 
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17191c] hover:bg-[#17191c] hover:text-white transition-all duration-200 border border-[#ececec] shadow-xs"
                aria-label="Facebook"
              >
                <Facebook size={15} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer referrer" 
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17191c] hover:bg-[#17191c] hover:text-white transition-all duration-200 border border-[#ececec] shadow-xs"
                aria-label="Instagram"
              >
                <Instagram size={15} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer referrer" 
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17191c] hover:bg-[#17191c] hover:text-white transition-all duration-200 border border-[#ececec] shadow-xs"
                aria-label="LinkedIn"
              >
                <Linkedin size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#17191c]">Navigation</h3>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      navigateTo(link.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[14px] text-[#777b86] hover:text-[#17191c] hover:translate-x-0.5 transition-all cursor-pointer text-left py-0.5"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Office & Plant Locations Column */}
          <div className="lg:col-span-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#17191c]">Plant Locations & Support</h3>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {officeAddresses.map((office) => (
                <div key={office.name} className="p-4 rounded-2xl bg-white border border-[#ececec] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin size={14} className="text-[#c09748] shrink-0" />
                      <h4 className="text-[13px] font-semibold text-[#17191c]">{office.name}</h4>
                    </div>
                    <p className="text-[12px] text-[#777b86] leading-relaxed line-clamp-3">
                      {office.address}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f2f2f3] flex items-center justify-between text-[11px] text-[#777b86]">
                    <span className="font-medium text-[#17191c]">{office.contactPerson}</span>
                    <a href={`tel:${office.phone}`} className="text-[#c09748] hover:underline font-semibold">{office.phone}</a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#8a6521]">Ready to discuss a project?</p>
                <p className="text-[11px] text-[#8a6521]/80">Send your 2D/3D CAD drawings for instant review.</p>
              </div>
              <button 
                onClick={() => { navigateTo('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="pill-btn-filled text-[12px] !py-1.5 !px-3.5 shrink-0 cursor-pointer"
              >
                Get in Touch
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-16 border-t border-[#ececec] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#979799]">
          <p>© {new Date().getFullYear()} PaintKing Ltd. All rights reserved. Precision coating engineering since 1994.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#17191c] transition-colors cursor-pointer" onClick={() => navigateTo('about')}>Privacy Policy</span>
            <span className="hover:text-[#17191c] transition-colors cursor-pointer" onClick={() => navigateTo('about')}>Terms of Service</span>
            <span className="hover:text-[#17191c] transition-colors cursor-pointer" onClick={() => navigateTo('contact')}>Support</span>
            <span className="text-[#c09748] hover:text-[#8a6521] font-semibold transition-colors cursor-pointer flex items-center gap-1" onClick={() => navigateTo('portal')}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]" />
              <span>Staff Portal Login</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
