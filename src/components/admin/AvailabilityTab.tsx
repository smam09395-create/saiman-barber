import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, Plus, Trash2, Check, X, Shield } from 'lucide-react';
import { Barber, BarberAvailability, BlockedDate } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

interface AvailabilityTabProps {
  barbers: Barber[];
}

export const AvailabilityTab: React.FC<AvailabilityTabProps> = ({ barbers }) => {
  const { showToast } = useToast();
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || '');
  const [schedules, setSchedules] = useState<BarberAvailability[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  // New Blocked Date Form
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockBarberTarget, setBlockBarberTarget] = useState('ALL');
  const [addingBlock, setAddingBlock] = useState(false);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (barbers.length > 0 && !selectedBarberId) {
      setSelectedBarberId(barbers[0].id);
    }
  }, [barbers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allScheds, blocks] = await Promise.all([
        api.getBarberAvailability(),
        api.getBlockedDates(),
      ]);
      setSchedules(allScheds);
      setBlockedDates(blocks);
    } catch (err: any) {
      showToast(err.message || 'Failed to load availability data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleChange = async (
    dayOfWeek: number,
    field: 'is_available' | 'start_time' | 'end_time',
    value: any
  ) => {
    if (!selectedBarberId) return;

    try {
      const current = schedules.find(
        (s) => s.barber_id === selectedBarberId && s.day_of_week === dayOfWeek
      );

      const updatedPayload = {
        barber_id: selectedBarberId,
        day_of_week: dayOfWeek,
        start_time: field === 'start_time' ? value : current?.start_time || '09:00',
        end_time: field === 'end_time' ? value : current?.end_time || '19:00',
        is_available: field === 'is_available' ? value : (current?.is_available ?? 1),
      };

      await api.updateBarberAvailability(updatedPayload);

      setSchedules((prev) => {
        const idx = prev.findIndex(
          (s) => s.barber_id === selectedBarberId && s.day_of_week === dayOfWeek
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updatedPayload };
          return next;
        } else {
          return [...prev, { id: `avail-${selectedBarberId}-${dayOfWeek}`, ...updatedPayload }];
        }
      });

      showToast('Shift schedule updated in database');
    } catch (err: any) {
      showToast(err.message || 'Failed to update schedule', 'error');
    }
  };

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockReason.trim()) {
      showToast('Date and reason are required', 'error');
      return;
    }
    try {
      setAddingBlock(true);
      await api.addBlockedDate({
        barber_id: blockBarberTarget,
        date: blockDate,
        reason: blockReason.trim(),
      });
      showToast('Date successfully blocked');
      setBlockDate('');
      setBlockReason('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Could not block date', 'error');
    } finally {
      setAddingBlock(false);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      await api.deleteBlockedDate(id);
      showToast('Blocked date removed');
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Failed to remove blocked date', 'error');
    }
  };

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
          Barber Availability & Schedule Management
        </h3>
        <p className="text-xs text-[#8c8980]">
          Configure individual working shifts, days off, and shop holiday closures without direct database editing.
        </p>
      </div>

      {/* Barber Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[#232635] pb-3 overflow-x-auto">
        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBarberId(b.id)}
            className={`py-2 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
              selectedBarberId === b.id
                ? 'bg-[#c5a059] text-[#0a0b0d]'
                : 'bg-[#151722] text-[#8c8980] hover:text-white border border-[#232635]'
            }`}
          >
            {b.name} ({b.specialty.split('&')[0].trim()})
          </button>
        ))}
      </div>

      {/* Day-of-Week Schedule Control */}
      <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1f2230]">
          <div>
            <h4 className="text-base font-semibold text-[#f4f2ed]">
              Weekly Working Hours for {selectedBarber?.name}
            </h4>
            <span className="text-xs text-[#8c8980]">
              Customers will only see slots inside these active working windows.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {daysOfWeek.map((dayName, dayIndex) => {
            const sched = schedules.find(
              (s) => s.barber_id === selectedBarberId && s.day_of_week === dayIndex
            );
            const isOpen = sched ? Boolean(sched.is_available) : dayIndex >= 1 && dayIndex <= 6;
            const startTime = sched?.start_time || '09:00';
            const endTime = sched?.end_time || '19:00';

            return (
              <div
                key={dayName}
                className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isOpen
                    ? 'bg-[#161824] border-[#252838]'
                    : 'bg-[#141215] border-stone-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleScheduleChange(dayIndex, 'is_available', isOpen ? 0 : 1)}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                      isOpen
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-stone-800 text-stone-400 border border-stone-700'
                    }`}
                  >
                    {isOpen ? 'Open / Shift' : 'Closed / Off'}
                  </button>
                  <span className="text-sm font-semibold text-[#edebe6] w-28">
                    {dayName}
                  </span>
                </div>

                {isOpen ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8c8980]">Shift:</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) =>
                        handleScheduleChange(dayIndex, 'start_time', e.target.value)
                      }
                      className="bg-[#1b1e2c] border border-[#2b2e40] text-white px-2 py-1.5 rounded font-mono"
                    />
                    <span className="text-[#8c8980]">to</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) =>
                        handleScheduleChange(dayIndex, 'end_time', e.target.value)
                      }
                      className="bg-[#1b1e2c] border border-[#2b2e40] text-white px-2 py-1.5 rounded font-mono"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-[#716e66] italic">
                    No appointments accepted on this day
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Dates / Holiday Closures Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Blocked Date Form */}
        <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl">
          <h4 className="text-base font-semibold text-[#f4f2ed] mb-1">
            Block Specific Date / Holiday Closure
          </h4>
          <p className="text-xs text-[#8c8980] mb-5">
            Prevent any bookings from being placed on specific dates or holidays.
          </p>

          <form onSubmit={handleAddBlockedDate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Barber Target
              </label>
              <select
                value={blockBarberTarget}
                onChange={(e) => setBlockBarberTarget(e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              >
                <option value="ALL">All Barbers (Entire Studio Closed)</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} Only
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Date to Block
              </label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Reason for Closure
              </label>
              <input
                type="text"
                required
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. National Holiday, Studio Renovation, Master Masterclass..."
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={addingBlock}
              className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors disabled:opacity-50"
            >
              {addingBlock ? 'Saving...' : 'Add Blocked Date'}
            </button>
          </form>
        </div>

        {/* Existing Blocked Dates List */}
        <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-base font-semibold text-[#f4f2ed] mb-1">
              Active Blocked Dates ({blockedDates.length})
            </h4>
            <p className="text-xs text-[#8c8980] mb-4">
              Current closures stored in database.
            </p>

            {blockedDates.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8c8980]">
                No dates are currently blocked. The studio operates on normal schedules.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {blockedDates.map((b) => {
                  const barberTargetName =
                    b.barber_id === 'ALL'
                      ? 'Entire Studio Closed'
                      : barbers.find((br) => br.id === b.barber_id)?.name || 'Specific Barber';

                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg bg-[#181a25] border border-[#252837] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#c5a059]">{b.date}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#222533] text-stone-300">
                            {barberTargetName}
                          </span>
                        </div>
                        <span className="text-[#8c8980] block mt-0.5">{b.reason}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteBlockedDate(b.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40"
                        title="Remove Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
