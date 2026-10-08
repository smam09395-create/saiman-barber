import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const galleryItems = [
    {
      id: 'g-1',
      title: 'Precision Razor Skin Fade',
      category: 'fades',
      categoryLabel: 'Skin Fade',
      src: '/src/assets/images/gallery_skin_fade_1791309741240.jpg',
      aspect: 'col-span-1 md:col-span-2 row-span-1 md:row-span-2',
    },
    {
      id: 'g-2',
      title: 'The Soho Sanctuary Interior',
      category: 'studio',
      categoryLabel: 'Studio',
      src: '/src/assets/images/hero_barber_interior_1791309682849.jpg',
      aspect: 'col-span-1 row-span-1',
    },
    {
      id: 'g-3',
      title: 'Hot Towel Beard Sculpting',
      category: 'beard',
      categoryLabel: 'Beard Craft',
      src: '/src/assets/images/barber_hamza_portrait_1791309725947.jpg',
      aspect: 'col-span-1 row-span-1',
    },
    {
      id: 'g-4',
      title: 'Scissor Texture & Scenery',
      category: 'fades',
      categoryLabel: 'Scissor Cut',
      src: '/src/assets/images/barber_rayyan_portrait_1791309710715.jpg',
      aspect: 'col-span-1 row-span-1',
    },
    {
      id: 'g-5',
      title: 'Master Consultation & Styling',
      category: 'studio',
      categoryLabel: 'Craftsmanship',
      src: '/src/assets/images/barber_saiman_portrait_1791309696168.jpg',
      aspect: 'col-span-1 md:col-span-2 row-span-1',
    },
  ];

  const filteredItems = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeFilter);

  return (
    <section id="gallery" className="py-24 bg-[#0d0e12] border-t border-[#1c1e26] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
              <span>Visual Portfolio</span>
              <span aria-hidden="true">·</span>
              <span>The Craft</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight">
              Selected Works
            </h2>
          </div>

          {/* Interactive filter tabs (functional buttons allowed per skill) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#13151d] rounded-lg border border-[#232632] self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-[#c5a059] text-[#0a0b0d] font-semibold'
                  : 'text-[#8e8b82] hover:text-[#edebe6]'
              }`}
            >
              All Works
            </button>
            <button
              onClick={() => setActiveFilter('fades')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeFilter === 'fades'
                  ? 'bg-[#c5a059] text-[#0a0b0d] font-semibold'
                  : 'text-[#8e8b82] hover:text-[#edebe6]'
              }`}
            >
              Tapers & Fades
            </button>
            <button
              onClick={() => setActiveFilter('beard')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeFilter === 'beard'
                  ? 'bg-[#c5a059] text-[#0a0b0d] font-semibold'
                  : 'text-[#8e8b82] hover:text-[#edebe6]'
              }`}
            >
              Beard Craft
            </button>
            <button
              onClick={() => setActiveFilter('studio')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeFilter === 'studio'
                  ? 'bg-[#c5a059] text-[#0a0b0d] font-semibold'
                  : 'text-[#8e8b82] hover:text-[#edebe6]'
              }`}
            >
              Studio Atmosphere
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveImage(item.src)}
              className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#161820] border border-[#232633] aspect-[4/3] transition-all duration-300 hover:border-[#c5a059]/50"
            >
              <img
                src={item.src}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="text-[11px] font-mono text-[#c5a059] tracking-wider uppercase block mb-1">
                    {item.categoryLabel}
                  </span>
                  <h4 className="text-base font-display font-semibold text-[#f4f2ed] leading-snug">
                    {item.title}
                  </h4>
                </div>
                <div className="p-2 rounded-lg bg-black/60 text-white/80 group-hover:text-[#c5a059] backdrop-blur-sm transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeImage}
            alt="Expanded view"
            referrerPolicy="no-referrer"
            className="max-w-4xl max-h-[85vh] object-contain rounded-lg border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};
