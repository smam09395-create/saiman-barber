import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Calendar, Instagram } from 'lucide-react';
import { Settings } from '../types/index.ts';
import { useToast } from './Toast.tsx';

interface ContactSectionProps {
  settings: Settings;
  onOpenBooking: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  settings,
  onOpenBooking,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      showToast('Please provide your name and a message.', 'error');
      return;
    }
    setSent(true);
    showToast('Your message has been sent to the SAIMAN concierge.');
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSent(false);
    }, 2000);
  };

  const address = settings.address || '482 Grand Avenue, Suite 100, Soho, New York, NY 10013';
  const phone = settings.phone || '+1 (555) 724-6260';
  const emailAddr = settings.email || 'concierge@saimanbarber.com';
  const weekdayHours = settings.hours_weekday || 'Mon - Fri: 9:00 AM - 8:00 PM';
  const satHours = settings.hours_saturday || 'Saturday: 9:00 AM - 7:00 PM';
  const sunHours = settings.hours_sunday || 'Sunday: Closed / VIP Private Sessions';

  return (
    <section id="contact" className="py-24 bg-[#0a0b0d] border-t border-[#1c1e26] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Full-width Final Call to Action */}
        <div className="mb-24 rounded-2xl bg-gradient-to-r from-[#12141a] via-[#171922] to-[#12141a] border border-[#262a38] p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#c5a059]/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight mb-4 text-balance">
              Your Next Look Starts Here.
            </h2>
            <p className="text-base text-[#9e9b92] leading-relaxed mb-8">
              Step into an unhurried sanctuary where every cut is treated as an architectural statement. Reserve your chair today.
            </p>
            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-all rounded-md shadow-xl shadow-[#c5a059]/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Your Appointment</span>
            </button>
          </div>
        </div>

        {/* Contact Information & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Contact details & studio location */}
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
              <span>Location & Inquiries</span>
              <span aria-hidden="true">·</span>
              <span>Soho District</span>
            </div>
            <h3 className="text-3xl font-display font-bold text-[#f4f2ed] tracking-tight mb-6">
              Visit the Studio
            </h3>

            <div className="space-y-6 text-sm text-[#9e9b92]">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-[#14161f] border border-[#242735] text-[#c5a059] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-semibold tracking-wider text-[#edebe6] mb-1">Studio Address</h4>
                  <p>{address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-[#14161f] border border-[#242735] text-[#c5a059] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-semibold tracking-wider text-[#edebe6] mb-1">Operating Hours</h4>
                  <p>{weekdayHours}</p>
                  <p>{satHours}</p>
                  <p>{sunHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-[#14161f] border border-[#242735] text-[#c5a059] shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-semibold tracking-wider text-[#edebe6] mb-1">Direct Line & Concierge</h4>
                  <p>{phone}</p>
                  <p className="text-xs text-[#737067] mt-0.5">SMS text confirmation support available 24/7</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-[#14161f] border border-[#242735] text-[#c5a059] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-semibold tracking-wider text-[#edebe6] mb-1">Electronic Inquiries</h4>
                  <p>{emailAddr}</p>
                </div>
              </div>
            </div>

            {/* Interactive simulated studio map */}
            <div className="mt-8 rounded-xl overflow-hidden border border-[#242735] relative bg-[#13151c] p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#c5a059]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>SOHO LOCATION MAP</span>
                </div>
                <span className="text-[11px] text-[#716e66]">Subway: N, R, W (Prince St)</span>
              </div>
              <div className="h-44 w-full rounded-lg bg-[#181a24] border border-[#2b2e3e] flex flex-col items-center justify-center relative overflow-hidden group">
                {/* Stylized dark map grid graphics */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative z-10 flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-[#c5a059] text-black flex items-center justify-center shadow-lg shadow-[#c5a059]/40 mb-2 animate-bounce">
                    <MapPin className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-sm font-semibold text-white">SAIMAN Master Barber Studio</span>
                  <span className="text-xs text-[#a09d94]">Corner of Grand Ave & Mercer St</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Inquiries Form */}
          <div className="bg-[#12141a] rounded-xl border border-[#232633] p-7 sm:p-9 shadow-xl">
            <h4 className="text-xl font-display font-bold text-[#f4f2ed] mb-2">
              Send Concierge a Message
            </h4>
            <p className="text-xs text-[#8c8980] mb-6">
              Have a special request, wedding inquiry, or styling question? Leave us a note.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alexander Thorne"
                  className="w-full bg-[#181a22] border border-[#292c3a] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full bg-[#181a22] border border-[#292c3a] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist your grooming routine?"
                  className="w-full bg-[#181a22] border border-[#292c3a] text-white text-sm rounded-lg p-3.5 focus:border-[#c5a059] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={sent}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sent ? 'Message Sent' : 'Send Message'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
