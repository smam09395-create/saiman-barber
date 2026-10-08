import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenBooking }) => {
  return (
    <footer className="bg-[#07080a] border-t border-[#1a1c24] py-16 text-[#858278] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Wordmark & Brand Philosophy */}
          <div className="md:col-span-2">
            <span className="text-2xl font-display font-bold tracking-widest text-[#f4f2ed] block mb-3">
              SAIMAN
            </span>
            <p className="text-sm text-[#8a877e] leading-relaxed max-w-md mb-6">
              Modern architectural barbershop located in Soho, New York. Delivering precision fades, scissor contouring, and hot lather straight razor rituals in an unhurried, luxury sanctuary.
            </p>
            <div className="text-xs text-[#716e66]">
              <span>482 Grand Avenue, Suite 100 · Soho, NY 10013 · +1 (555) 724-6260</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#edebe6] mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#9d9a90]">
              <li>
                <a href="#home" className="hover:text-[#c5a059] transition-colors">Home</a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#c5a059] transition-colors">Services & Pricing</a>
              </li>
              <li>
                <a href="#barbers" className="hover:text-[#c5a059] transition-colors">The Barbers</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#c5a059] transition-colors">Work Gallery</a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#c5a059] transition-colors">Our Heritage</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#c5a059] transition-colors">Location & Hours</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Booking */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#edebe6] mb-4">
              Client Portal
            </h4>
            <div className="space-y-3">
              <button
                onClick={onOpenBooking}
                className="w-full text-left py-2 px-3 rounded bg-[#13151c] border border-[#222531] text-xs font-semibold text-[#c5a059] hover:bg-[#1c1f29] transition-colors"
              >
                Book Appointment Online →
              </button>
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-2 py-2 px-3 rounded bg-[#101217] border border-[#1e2029] text-xs text-[#7d7a71] hover:text-[#edebe6] transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Admin & Staff Management</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Bottom Bar */}
        <div className="pt-8 border-t border-[#15171e] flex flex-col sm:flex-row items-center justify-between text-xs text-[#636058] gap-4">
          <p>© {new Date().getFullYear()} SAIMAN Barber Shop & Grooming. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>By Appointment Only</span>
            <span aria-hidden="true">·</span>
            <span>Zero Double-Booking Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
