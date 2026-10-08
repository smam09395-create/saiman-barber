import React from 'react';
import { Calendar, Award, Clock } from 'lucide-react';
import { Barber } from '../types/index.ts';

interface BarbersSectionProps {
  barbers: Barber[];
  onSelectBarber: (barberId: string) => void;
}

export const BarbersSection: React.FC<BarbersSectionProps> = ({
  barbers,
  onSelectBarber,
}) => {
  return (
    <section id="barbers" className="py-24 bg-[#0d0e12] border-t border-[#1c1e26] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
            <span>The Team</span>
            <span aria-hidden="true">·</span>
            <span>Master Artisans</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight">
            Meet the Masters
          </h2>
          <p className="mt-4 text-base text-[#9e9b92] leading-relaxed">
            Our resident barbers bring decades of collective discipline, precision blades, and aesthetic mastery to every appointment.
          </p>
        </div>

        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="group flex flex-col bg-[#12141a] rounded-xl border border-[#21242e] hover:border-[#c5a059]/40 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-xl"
            >
              {/* Barber Image with subtle zoom on hover */}
              <div className="relative aspect-[4/3] sm:aspect-[1/1] overflow-hidden bg-[#1a1c24]">
                <img
                  src={barber.image}
                  alt={barber.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top filter brightness-[0.92] group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141a] via-transparent to-transparent opacity-90" />
                
                {/* Floating experience badge (Quiet unboxed style) */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90 font-medium">
                  <span className="bg-[#0a0b0d]/80 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 text-[#dfbe7d]">
                    {barber.experience}
                  </span>
                </div>
              </div>

              {/* Barber Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold text-[#f4f2ed] mb-1">
                    {barber.name}
                  </h3>
                  <div className="text-xs uppercase tracking-wider font-semibold text-[#c5a059] mb-4">
                    {barber.specialty}
                  </div>
                  <p className="text-sm text-[#8f8c83] leading-relaxed mb-5">
                    {barber.bio}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1d2028] flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-[#7e7b72]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>{barber.available_hours}</span>
                    </span>
                    <span className="text-[#a4a095]">Active</span>
                  </div>

                  <button
                    onClick={() => onSelectBarber(barber.id)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg shadow"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book with {barber.name}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
