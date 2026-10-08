import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  Calendar as CalendarIcon,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Service, Barber, SlotInfo, Booking } from '../types/index.ts';
import { api } from '../api/client.ts';
import { BookingConfirmation } from './BookingConfirmation.tsx';
import { useToast } from './Toast.tsx';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  barbers: Barber[];
  initialServiceId?: string;
  initialBarberId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  barbers,
  initialServiceId,
  initialBarberId,
}) => {
  const { showToast } = useToast();

  // Steps: 1 (Service) -> 2 (Barber) -> 3 (Date) -> 4 (Time) -> 5 (Details) -> 6 (Summary) -> 7 (Confirmation)
  const [step, setStep] = useState(1);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || '');
  const [selectedBarberId, setSelectedBarberId] = useState(initialBarberId || 'any');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Availability state
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotErrorMessage, setSlotErrorMessage] = useState('');

  // Booking submission
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Calendar month state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Sync initial props
  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
      if (step === 1) setStep(2);
    }
    if (initialBarberId) {
      setSelectedBarberId(initialBarberId);
    }
  }, [initialServiceId, initialBarberId]);

  // When step 4 or date/service/barber changes, load slots
  useEffect(() => {
    if (selectedDate && selectedServiceId) {
      loadSlots();
    }
  }, [selectedDate, selectedServiceId, selectedBarberId]);

  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      setSlotErrorMessage('');
      const res = await api.getAvailableSlots(selectedDate, selectedServiceId, selectedBarberId);
      setAvailableSlots(res.slots || []);
      if (res.slots.length === 0) {
        setSlotErrorMessage(res.message || 'No available appointment slots for this date.');
      }
    } catch (err: any) {
      setAvailableSlots([]);
      setSlotErrorMessage(err.message || 'Failed to load available slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const currentService = services.find((s) => s.id === selectedServiceId);
  const currentBarber = barbers.find((b) => b.id === selectedBarberId);

  // Calendar calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    const nowMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (prev >= nowMonth) {
      setCurrentMonthDate(prev);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(''); // Reset time when date changes
    setStep(4);
  };

  const handleTimeSelect = (timeStr: string) => {
    setSelectedTime(timeStr);
    setStep(5);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 7) {
      showToast('Please provide a valid phone number', 'error');
      return;
    }
    setStep(6);
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);
      setBookingError('');

      const result = await api.createBooking({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        service_id: selectedServiceId,
        barber_id: selectedBarberId,
        appointment_date: selectedDate,
        start_time: selectedTime,
        customer_notes: customerNotes || undefined,
      });

      setConfirmedBooking(result);
      setStep(7);
      showToast('Appointment successfully confirmed!');
    } catch (err: any) {
      const msg = err.message || 'Unable to confirm appointment.';
      setBookingError(msg);
      showToast(msg, 'error');
      // If double-booked, take user back to slot selection
      if (msg.includes('booked') || msg.includes('slot')) {
        setTimeout(() => {
          setStep(4);
          loadSlots();
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedServiceId('');
    setSelectedBarberId('any');
    setSelectedDate('');
    setSelectedTime('');
    setConfirmedBooking(null);
    setBookingError('');
  };

  // Group slots by time of day
  const morningSlots = availableSlots.filter((s) => s.time < '12:00');
  const afternoonSlots = availableSlots.filter((s) => s.time >= '12:00' && s.time < '17:00');
  const eveningSlots = availableSlots.filter((s) => s.time >= '17:00');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {step === 7 && confirmedBooking ? (
        <BookingConfirmation
          booking={confirmedBooking}
          onClose={onClose}
          onBookAnother={resetAll}
        />
      ) : (
        <div className="bg-[#101217] border border-[#242735] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-[#1e212c] flex items-center justify-between bg-[#13151e]">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="p-1.5 text-[#8c8980] hover:text-white rounded-lg hover:bg-[#1f2230] transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#c5a059]">
                  Step {step} of 6
                </span>
                <h3 className="text-lg font-display font-bold text-[#f4f2ed] leading-tight">
                  {step === 1 && 'Select Your Service'}
                  {step === 2 && 'Select Your Master Barber'}
                  {step === 3 && 'Choose Appointment Date'}
                  {step === 4 && 'Choose Available Time Slot'}
                  {step === 5 && 'Client Contact Information'}
                  {step === 6 && 'Review & Confirm Reservation'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#8c8980] hover:text-white rounded-lg hover:bg-[#1f2230] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Line */}
          <div className="w-full bg-[#181a24] h-1 flex">
            <div
              className="bg-[#c5a059] h-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* ================= STEP 1: SELECT SERVICE ================= */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-[#8c8980] mb-2">
                  Select a grooming service from our curated menu:
                </p>
                <div className="space-y-3">
                  {services.map((s) => {
                    const isSelected = selectedServiceId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedServiceId(s.id);
                          setStep(2);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#181b26] border-[#c5a059] shadow-md shadow-[#c5a059]/10'
                            : 'bg-[#13151d] border-[#222532] hover:border-[#383d52] hover:bg-[#171922]'
                        }`}
                      >
                        <div className="pr-4">
                          <h4 className="text-base font-semibold text-[#f4f2ed] mb-1">
                            {s.name}
                          </h4>
                          <p className="text-xs text-[#8a877e] line-clamp-2 leading-relaxed">
                            {s.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#b8b5ab]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                              <span className="tabular-nums">{s.duration} mins</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xl font-display font-bold text-[#c5a059] tabular-nums">
                            ${s.price}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= STEP 2: SELECT BARBER ================= */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-[#8c8980] mb-2">
                  Choose a specific artisan or allow any available master to service your booking:
                </p>

                {/* Any Barber Option */}
                <div
                  onClick={() => {
                    setSelectedBarberId('any');
                    setStep(3);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedBarberId === 'any'
                      ? 'bg-[#181b26] border-[#c5a059]'
                      : 'bg-[#13151d] border-[#222532] hover:border-[#383d52]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#f4f2ed]">
                        Any Available Master
                      </h4>
                      <p className="text-xs text-[#8c8980]">
                        Greatest flexibility for appointment time slots
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8c8980]" />
                </div>

                {/* Specific Barbers */}
                <div className="space-y-3 pt-2">
                  {barbers.map((b) => {
                    const isSelected = selectedBarberId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBarberId(b.id);
                          setStep(3);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#181b26] border-[#c5a059]'
                            : 'bg-[#13151d] border-[#222532] hover:border-[#383d52]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={b.image}
                            alt={b.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <h4 className="text-base font-semibold text-[#f4f2ed]">
                              {b.name}
                            </h4>
                            <p className="text-xs text-[#c5a059] font-medium">
                              {b.specialty}
                            </p>
                            <span className="text-[11px] text-[#716e66] block">
                              {b.experience} · {b.available_hours}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#8c8980]" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= STEP 3: SELECT DATE (CALENDAR) ================= */}
            {step === 3 && (
              <div>
                <p className="text-xs text-[#8c8980] mb-4">
                  Select a date. Past dates and scheduled shop closures are disabled:
                </p>

                {/* Calendar Header */}
                <div className="bg-[#14161f] rounded-xl border border-[#242735] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-base font-display font-semibold text-[#f4f2ed]">
                      {currentMonthDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg border border-[#272a39] hover:bg-[#1d202d] text-[#8c8980] hover:text-white transition-colors"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg border border-[#272a39] hover:bg-[#1d202d] text-[#8c8980] hover:text-white transition-colors"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono text-[#8c8980] mb-2 uppercase tracking-wider">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Empty placeholder days before first day of month */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Days in Month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                        dayNum
                      ).padStart(2, '0')}`;
                      const isPast = dateStr < todayStr;
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={dateStr}
                          disabled={isPast}
                          onClick={() => handleDateSelect(dateStr)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#c5a059] text-[#0a0b0d] font-bold shadow-md shadow-[#c5a059]/20'
                              : isPast
                              ? 'text-stone-700 cursor-not-allowed bg-stone-900/20'
                              : 'text-[#edebe6] hover:bg-[#202330] hover:text-[#c5a059]'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: SELECT TIME SLOT ================= */}
            {step === 4 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-[#8c8980]">
                    Showing live slots for{' '}
                    <strong className="text-[#edebe6]">
                      {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </strong>{' '}
                    ({currentService?.duration} min duration)
                  </span>

                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-[#c5a059] hover:underline"
                  >
                    Change Date
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-8 h-8 text-[#c5a059] animate-spin mb-3" />
                    <p className="text-xs text-[#8c8980]">Verifying live barber schedules...</p>
                  </div>
                ) : slotErrorMessage ? (
                  <div className="py-12 px-6 rounded-xl bg-[#1a1315] border border-red-900/40 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-red-200 mb-1">
                      {slotErrorMessage}
                    </p>
                    <p className="text-xs text-red-300/70 mb-4">
                      Please select an alternative date or barber.
                    </p>
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-200 bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors"
                    >
                      Pick Another Date
                    </button>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-12 px-6 rounded-xl bg-[#14161f] border border-[#242735] text-center">
                    <p className="text-sm text-[#edebe6] mb-3">
                      All slots are currently booked for this date.
                    </p>
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] rounded-lg hover:bg-[#dfbe7d] transition-colors"
                    >
                      Choose Another Date
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {morningSlots.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[#8c8980] mb-2.5">
                          Morning Slots
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {morningSlots.map((s) => (
                            <button
                              key={s.time}
                              onClick={() => handleTimeSelect(s.time)}
                              className={`py-2.5 px-3 rounded-lg border text-sm font-mono font-medium transition-all ${
                                selectedTime === s.time
                                  ? 'bg-[#c5a059] text-[#0a0b0d] border-[#c5a059] font-bold shadow'
                                  : 'bg-[#151722] border-[#252837] text-[#edebe6] hover:border-[#c5a059]/60 hover:text-[#c5a059]'
                              }`}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[#8c8980] mb-2.5">
                          Afternoon Slots
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {afternoonSlots.map((s) => (
                            <button
                              key={s.time}
                              onClick={() => handleTimeSelect(s.time)}
                              className={`py-2.5 px-3 rounded-lg border text-sm font-mono font-medium transition-all ${
                                selectedTime === s.time
                                  ? 'bg-[#c5a059] text-[#0a0b0d] border-[#c5a059] font-bold shadow'
                                  : 'bg-[#151722] border-[#252837] text-[#edebe6] hover:border-[#c5a059]/60 hover:text-[#c5a059]'
                              }`}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {eveningSlots.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[#8c8980] mb-2.5">
                          Evening Slots
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {eveningSlots.map((s) => (
                            <button
                              key={s.time}
                              onClick={() => handleTimeSelect(s.time)}
                              className={`py-2.5 px-3 rounded-lg border text-sm font-mono font-medium transition-all ${
                                selectedTime === s.time
                                  ? 'bg-[#c5a059] text-[#0a0b0d] border-[#c5a059] font-bold shadow'
                                  : 'bg-[#151722] border-[#252837] text-[#edebe6] hover:border-[#c5a059]/60 hover:text-[#c5a059]'
                              }`}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 5: CUSTOMER INFORMATION ================= */}
            {step === 5 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <p className="text-xs text-[#8c8980] mb-2">
                  Please provide your contact information to receive appointment confirmation details:
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Christian Vance"
                    className="w-full bg-[#161822] border border-[#262939] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                    Mobile Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 234-5678"
                    className="w-full bg-[#161822] border border-[#262939] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#78756c] block mt-1">
                    Used strictly for appointment confirmations & reminders.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                    Email Address <span className="text-stone-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. christian@example.com"
                    className="w-full bg-[#161822] border border-[#262939] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
                    Special Requests or Notes <span className="text-stone-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Prefer razor finish, wedding event preparation..."
                    className="w-full bg-[#161822] border border-[#262939] text-white text-sm rounded-lg p-3 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg font-mono"
                  >
                    Proceed to Review & Confirm
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 6: SUMMARY & ATOMIC CONFIRM ================= */}
            {step === 6 && (
              <div className="space-y-6">
                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="bg-[#141620] rounded-xl border border-[#262939] p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#212433]">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980]">
                      Service
                    </span>
                    <span className="text-sm font-semibold text-[#edebe6] text-right">
                      {currentService?.name} (${currentService?.price})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-[#212433]">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980]">
                      Barber
                    </span>
                    <span className="text-sm font-semibold text-[#edebe6] text-right">
                      {currentBarber ? currentBarber.name : 'Any Available Master'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-[#212433]">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980]">
                      Date & Time
                    </span>
                    <span className="text-sm font-semibold text-[#edebe6] text-right">
                      {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}{' '}
                      at {selectedTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-[#212433]">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980]">
                      Client Details
                    </span>
                    <div className="text-right text-xs text-[#edebe6]">
                      <div className="font-semibold">{customerName}</div>
                      <div className="text-[#8c8980]">{customerPhone}</div>
                      {customerEmail && <div className="text-[#8c8980]">{customerEmail}</div>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold uppercase text-[#c5a059]">
                      Total Due in Chair
                    </span>
                    <span className="text-2xl font-display font-bold text-[#edebe6] tabular-nums">
                      ${currentService?.price}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg font-mono disabled:opacity-50 shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Reserving Slot...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Appointment</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setStep(5)}
                    className="w-full py-2.5 text-xs text-[#8c8980] hover:text-white transition-colors"
                  >
                    Edit Information
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
