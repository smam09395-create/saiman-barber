import React from 'react';
import { Award, Compass, Sparkles, Coffee } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      num: '01',
      title: 'Decades of Discipline',
      description:
        'Every master barber is extensively trained in classic European and modern geometric techniques. No rushed cuts, only deliberate precision.',
      icon: Award,
    },
    {
      num: '02',
      title: 'Structural Architecture',
      description:
        'We tailor hairline angles, beard taper contours, and crown weight distributions uniquely to your cranial anatomy and facial contours.',
      icon: Compass,
    },
    {
      num: '03',
      title: 'Artisan Formulations',
      description:
        'Only organic cold-pressed beard elixirs, imported Italian hot lather creams, and water-soluble matte pomades touch your skin and hair.',
      icon: Sparkles,
    },
    {
      num: '04',
      title: 'Sanctuary Atmosphere',
      description:
        'A tranquil space featuring leather salon chairs, complimentary single-origin espresso or aged bourbon, and acoustic jazz.',
      icon: Coffee,
    },
  ];

  return (
    <section className="py-24 bg-[#0a0b0d] border-t border-[#1c1e26] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
            <span>Philosophy</span>
            <span aria-hidden="true">·</span>
            <span>Standards of Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight">
            Why Discerning Clients Choose SAIMAN
          </h2>
          <p className="mt-4 text-base text-[#9e9b92] leading-relaxed">
            We reject the conveyor-belt approach of ordinary barbershops. Here, grooming is an unhurried ritual of personal care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.num}
                className="bg-[#111319] rounded-xl border border-[#21242e] p-7 flex flex-col justify-between hover:border-[#c5a059]/40 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-mono text-[#c5a059]">{feat.num}.</span>
                    <div className="p-2.5 rounded-lg bg-[#181a22] text-[#c5a059] border border-[#282b37] group-hover:bg-[#c5a059]/10 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#f4f2ed] mb-3 group-hover:text-[#c5a059] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#8c8980] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
