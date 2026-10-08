import React from 'react';
import { Clock, ArrowRight, Scissors } from 'lucide-react';
import { Service } from '../types/index.ts';

interface ServicesSectionProps {
  services: Service[];
  onSelectService: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService,
}) => {
  return (
    <section id="services" className="py-24 bg-[#0a0b0d] border-t border-[#1c1e26] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
            <span>Bespoke Menu</span>
            <span aria-hidden="true">·</span>
            <span>Craftsmanship</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight">
            Curated Grooming Services
          </h2>
          <p className="mt-4 text-base text-[#9e9b92] leading-relaxed">
            Every session begins with a personalized structural consultation, followed by precision styling, 
            artisan neck shave, and premium imported styling balms.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const editorialIndex = (index + 1).toString().padStart(2, '0');
            return (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between bg-[#12141b] rounded-xl border border-[#21242e] hover:border-[#c5a059]/40 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[#c5a059]/5"
              >
                <div>
                  {/* Top row with index and price */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-mono font-medium text-[#c5a059]/80">
                      {editorialIndex}.
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold text-[#edebe6] tabular-nums">
                        ${service.price}
                      </span>
                    </div>
                  </div>

                  {/* Service Title */}
                  <h3 className="text-xl font-display font-semibold text-[#f4f2ed] mb-2 group-hover:text-[#c5a059] transition-colors">
                    {service.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#8c8980] leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                {/* Footer with duration and book button */}
                <div className="pt-4 border-t border-[#1e2029] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#b8b5ab]">
                    <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span className="tabular-nums">{service.duration} mins</span>
                  </div>

                  <button
                    onClick={() => onSelectService(service.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#c5a059] group-hover:text-[#dfbe7d] transition-colors py-1.5 px-3 rounded hover:bg-[#1a1c24]"
                  >
                    <span>Book Service</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom notes callout */}
        <div className="mt-12 p-6 rounded-xl bg-[#111319] border border-[#1e212b] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#f4f2ed]">Looking for a bespoke package or wedding groom party?</h4>
              <p className="text-xs text-[#8c8980]">Private studio buyouts and groomsmen reservations are available upon request.</p>
            </div>
          </div>
          <a
            href="#contact"
            className="text-xs font-semibold uppercase tracking-wider text-[#c5a059] hover:underline whitespace-nowrap"
          >
            Inquire for Private Buyouts →
          </a>
        </div>
      </div>
    </section>
  );
};
