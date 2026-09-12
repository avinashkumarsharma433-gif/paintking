import React, { useState } from 'react';
import { blogPosts } from '../data';
import { PageBanner } from '../components/PageBanner';
import { Calendar, ArrowLeft } from 'lucide-react';

interface BlogProps {
  navigateTo: (page: string) => void;
}

export const Blog: React.FC<BlogProps> = ({ navigateTo }) => {
  const [selectedPost, setSelectedPost] = useState<typeof blogPosts[0] | null>(null);

  const handleBackToFeed = () => {
    setSelectedPost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadPost = (post: typeof blogPosts[0]) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {selectedPost ? (
        /* -------------- BLOG SINGLE POST VIEW ------------- */
        <div>
          {/* Hero Banner for Selected Post */}
          <section className="bg-[#fafafb] border-b border-[#ececec] py-20 px-4 sm:px-6">
            <div className="relative mx-auto max-w-4xl text-left">
              <button 
                onClick={handleBackToFeed}
                className="mb-8 inline-flex items-center gap-2 pill-btn-ghost text-xs cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Technical Articles</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-[#777b86]">
                <span className="text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be] font-medium">Technical Insights</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar size={13} className="text-[#c09748]" />
                  {selectedPost.date}
                </span>
              </div>

              <h1 className="text-2xl font-serif text-[#17191c] sm:text-4xl tracking-tight leading-tight mt-4">
                {selectedPost.title}
              </h1>

              {/* Author */}
              <div className="mt-8 flex items-center gap-3 border-t border-[#ececec] pt-6">
                <img 
                  src={selectedPost.avatar} 
                  alt={selectedPost.author} 
                  className="h-10 w-10 rounded-full border border-[#ececec] object-cover"
                />
                <div>
                  <span className="text-[11px] text-[#979799] uppercase tracking-wider block font-medium">Author</span>
                  <span className="text-xs font-semibold text-[#17191c] block mt-0.5">{selectedPost.author}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Body Content */}
          <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <div className="overflow-hidden rounded-[24px] border border-[#ececec] shadow-sm mb-12 bg-[#17191c]">
              <img 
                src={selectedPost.image} 
                alt={selectedPost.title} 
                className="w-full h-[320px] sm:h-[480px] object-cover saturate-110 brightness-95"
              />
            </div>

            <div className="max-w-none text-[#17191c] leading-relaxed space-y-6 text-sm sm:text-base">
              {selectedPost.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('###')) {
                  return (
                    <h3 key={index} className="text-xl sm:text-2xl font-serif text-[#17191c] mt-10 mb-3">
                      {paragraph.replace('###', '').trim()}
                    </h3>
                  );
                }
                return (
                  <p key={index} className="whitespace-pre-line text-[#777b86] text-[15px] leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            <div className="mt-16 border-t border-[#ececec] pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#979799] font-medium">
                Verified by PaintKing Chemical Laboratory Standards ✓
              </div>
              <button 
                onClick={handleBackToFeed}
                className="text-xs font-semibold text-[#c09748] hover:underline cursor-pointer"
              >
                ← Return to Articles List
              </button>
            </div>
          </section>
        </div>
      ) : (
        /* -------------- BLOG LIST VIEW ------------- */
        <div>
          {/* Page Banner */}
          <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132863/paintking/home/hero_slider/beauty-product-bottle-1.webp"
        title="Technical Insights & Surface Science" 
            subtitle="Learn from our QA chemists about Delta-E spectrophotometer calibrations, 3D water submersion physics, UV ink curing, and ASTM adhesion testing."
            breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Blog', active: true }]}
            navigateTo={navigateTo}
      />

          {/* Lists Grid */}
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <div 
                  key={post.slug}
                  className="rounded-[24px] border border-[#ececec] bg-white flex flex-col justify-between hover:border-[#c09748]/50 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-[#17191c]">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="h-full w-full object-cover filter saturate-110 brightness-95 group-hover:scale-105 duration-500"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-[#777b86]">
                        <span className="text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-full text-[10px] font-medium border border-[#f4e5be]">Engineering</span>
                        <span>•</span>
                        <span className="text-[11px]">{post.date}</span>
                      </div>

                      <h3 className="text-base font-serif text-[#17191c] mt-3 mb-2 group-hover:text-[#c09748] transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-[#777b86] text-xs leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-[#f2f2f3] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img 
                        src={post.avatar} 
                        alt={post.author} 
                        className="h-6 w-6 rounded-full object-cover border border-[#ececec]"
                      />
                      <span className="text-[#777b86] text-[11px] font-medium">{post.author}</span>
                    </div>

                    <button 
                      onClick={() => handleReadPost(post)}
                      className="text-xs font-semibold text-[#17191c] group-hover:text-[#c09748] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Article</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center text-xs text-[#979799] tracking-wider uppercase">
              Regularly publishing surface science and precision coating guides for Tier-1 OEMs.
            </div>
          </section>
        </div>
      )}

    </div>
  );
};
