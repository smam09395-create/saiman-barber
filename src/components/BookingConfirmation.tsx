import React from 'react';
import { CheckCircle2, Calendar, Clock, User, Scissors, Download, Home, Phone, Mail } from 'lucide-react';
import { Booking } from '../types/index.ts';

interface BookingConfirmationProps {
  booking: Booking;
  onClose: () => void;
  onBookAnother: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onClose,
  onBookAnother,
}) => {
  // Calendar export helper (.ics generator)
  const downloadIcs = () => {
    const startTimeFormatted = `${booking.appointment_date.replace(/-/g, '')}T${booking.start_time.replace(/:/g, '')}00Z`;
    const endTimeFormatted = `${booking.appointment_date.replace(/-/g, '')}T${booking.end_time.replace(/:/g, '')}00Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SAIMAN Barber//Appointment Booking//EN',
      'BEGIN:VEVENT',
      `UID:${booking.booking_reference}@saimanbarber.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startTimeFormatted}`,
      `DTEND:${endTimeFormatted}`,
      `SUMMARY:SAIMAN Appointment - ${booking.service_name || 'Grooming'}`,
      `DESCRIPTION:Appointment Reference: ${booking.booking_reference}\\nBarber: ${booking.barber_name || 'Master Barber'}\\nPrice: $${booking.price}`,
      'LOCATION:482 Grand Avenue, Suite 100, Soho, New York, NY 10013',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAIMAN-Appointment-${booking.booking_reference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#12141a] rounded-2xl border border-[#262937] p-6 sm:p-9 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge & Headline */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center mx-auto mb-4 text-[#c5a059]">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-[#c5a059] mb-1">
          Reservation Confirmed
        </div>
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#f4f2ed]">
          We Look Forward to Seeing You
        </h3>
        <p className="text-xs text-[#8c8980] mt-1.5">
          A confirmation SMS will be sent to your phone number shortly.
        </p>
      </div>

      {/* Appointment Ticket Card */}
      <div className="bg-[#161822] rounded-xl border border-[#292c3d] p-5 mb-6 divide-y divide-[#232635]">
        {/* Booking Reference Code */}
        <div className="pb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-[#8c8980] uppercase tracking-wider block">
              Booking ID
            </span>
            <span className="text-xl font-mono font-bold text-[#c5a059] tracking-wider">
              {booking.booking_reference}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-[#8c8980] uppercase tracking-wider block">
              Total Due
            </span>
            <span className="text-xl font-display font-bold text-[#edebe6] tabular-nums">
              ${booking.price}
            </span>
          </div>
        </div>

        {/* Core Details */}
        <div className="py-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#8c8980] flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#c5a059]" />
              <span>Service</span>
            </span>
            <span className="font-semibold text-[#edebe6] text-right">
              {booking.service_name || 'Selected Service'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8c8980] flex items-center gap-2">
              <User className="w-4 h-4 text-[#c5a059]" />
              <span>Barber</span>
            </span>
            <span className="font-semibold text-[#edebe6] text-right">
              {booking.barber_name || 'Master Barber'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8c8980] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#c5a059]" />
              <span>Date</span>
            </span>
            <span className="font-semibold text-[#edebe6] text-right">
              {new Date(`${booking.appointment_date}T00:00:00Z`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8c8980] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c5a059]" />
              <span>Time Slot</span>
            </span>
            <span className="font-semibold text-[#edebe6] text-right">
              {booking.start_time} - {booking.end_time}
            </span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="pt-4 space-y-1.5 text-xs text-[#8c8980]">
          <div className="flex justify-between">
            <span>Client Name:</span>
            <span className="text-[#edebe6] font-medium">{booking.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Phone:</span>
            <span className="text-[#edebe6] font-medium">{booking.customer_phone}</span>
          </div>
          {booking.customer_email && (
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="text-[#edebe6] font-medium">{booking.customer_email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={downloadIcs}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg shadow-md font-mono"
        >
          <Download className="w-4 h-4" />
          <span>Add to Google / Apple Calendar (.ics)</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBookAnother}
            className="py-2.5 px-3 text-xs font-medium text-[#c5a059] bg-[#161821] border border-[#282b3a] hover:bg-[#20232e] rounded-lg transition-colors"
          >
            Book Another Visit
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-3 text-xs font-medium text-[#9e9b92] hover:text-white bg-[#161821] border border-[#282b3a] hover:bg-[#20232e] rounded-lg transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
