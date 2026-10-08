import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { Booking, Barber, BookingStatus } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

interface AppointmentsTabProps {
  barbers: Barber[];
  onStatsRefresh: () => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  barbers,
  onStatsRefresh,
}) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterBarberId, setFilterBarberId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected booking modal
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminBookings({
        date: filterDate || undefined,
        barberId: filterBarberId || undefined,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      });
      setBookings(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [filterDate, filterBarberId, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings();
  };

  const handleUpdateStatus = async (id: string, newStatus: BookingStatus) => {
    try {
      const updated = await api.updateBookingStatus(id, newStatus);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (activeBooking && activeBooking.id === id) {
        setActiveBooking(updated);
      }
      if (newStatus === 'Completed') {
        showToast('✓ Order marked as Completed (Synced to Supabase)');
      } else {
        showToast(`Status updated to ${newStatus}`);
      }
      onStatsRefresh();
    } catch (err: any) {
      showToast(err.message || 'Could not update status', 'error');
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
            Confirmed
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-950/70 text-red-400 border border-red-800/60">
            Cancelled
          </span>
        );
      case 'No-show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-950/70 text-amber-400 border border-amber-800/60">
            No-show
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-stone-800 text-stone-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search Header */}
      <div className="bg-[#13151e] border border-[#232635] rounded-xl p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, phone, or reference..."
              className="w-full bg-[#181a24] border border-[#2a2e40] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:border-[#c5a059] focus:outline-none"
            />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-[#181a24] border border-[#2a2e40] text-white text-xs rounded-lg px-3 py-2.5 focus:border-[#c5a059] focus:outline-none"
            />
          </div>

          {/* Barber Filter */}
          <div>
            <select
              value={filterBarberId}
              onChange={(e) => setFilterBarberId(e.target.value)}
              className="w-full bg-[#181a24] border border-[#2a2e40] text-white text-xs rounded-lg px-3 py-2.5 focus:border-[#c5a059] focus:outline-none"
            >
              <option value="">All Barbers</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#181a24] border border-[#2a2e40] text-white text-xs rounded-lg px-3 py-2.5 focus:border-[#c5a059] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>

            {(filterDate || filterBarberId || filterStatus || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterDate('');
                  setFilterBarberId('');
                  setFilterStatus('');
                  setSearchQuery('');
                  loadBookings();
                }}
                className="px-2.5 py-2 rounded-lg bg-[#1f2230] text-[#8c8980] hover:text-white text-xs"
                title="Clear Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-[#232635]">
          <span className="text-[11px] text-[#8c8980] font-mono uppercase tracking-wider mr-1">
            Filter View:
          </span>
          <button
            type="button"
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              !filterStatus
                ? 'bg-[#c5a059] text-black font-semibold'
                : 'bg-[#181a24] text-stone-300 hover:text-white'
            }`}
          >
            All Appointments
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Confirmed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'Confirmed'
                ? 'bg-emerald-500 text-black font-semibold'
                : 'bg-[#181a24] text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            Confirmed
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Completed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 ${
              filterStatus === 'Completed'
                ? 'bg-emerald-400 text-black font-semibold'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/60 hover:bg-emerald-900/40'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>✓ Completed Orders</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Cancelled')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'Cancelled'
                ? 'bg-red-500 text-black font-semibold'
                : 'bg-[#181a24] text-red-400 hover:bg-red-950/40'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#13151e] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f2230] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#f4f2ed]">
            Appointments ({bookings.length})
          </h3>
          <span className="text-xs text-[#8c8980]">
            Real-time database sync
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#8c8980]">
            Loading appointments...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8c8980]">
            No appointments found matching current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181a25] text-[#8c8980] uppercase tracking-wider font-mono border-b border-[#232635]">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Barber</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e212d] text-[#edebe6]">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors cursor-pointer ${
                      b.status === 'Completed'
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/35 border-l-2 border-l-emerald-500'
                        : 'hover:bg-[#181a24]/60'
                    }`}
                    onClick={() => setActiveBooking(b)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#c5a059]">
                      {b.booking_reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{b.customer_name}</div>
                      <div className="text-[11px] text-[#8c8980]">{b.customer_phone}</div>
                    </td>
                    <td className="py-3 px-4">{b.service_name}</td>
                    <td className="py-3 px-4 text-[#dfbe7d]">{b.barber_name}</td>
                    <td className="py-3 px-4 tabular-nums">
                      <div>{b.appointment_date}</div>
                      <div className="text-[11px] text-[#8c8980]">
                        {b.start_time} - {b.end_time}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums">${b.price}</td>
                    <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/60">
                            <Check className="w-3.5 h-3.5" />
                            <span>Order Completed</span>
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'Completed')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold transition-colors shadow-sm"
                              title="Mark Order as Completed"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Complete Order</span>
                            </button>
                            {b.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'Cancelled')}
                                className="p-1 rounded hover:bg-red-950 text-red-400"
                                title="Cancel Appointment"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#252837] rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveBooking(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono text-[#c5a059] uppercase tracking-wider block">
                  Reference: {activeBooking.booking_reference}
                </span>
                <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
                  Appointment Details
                </h3>
              </div>
              <div>{getStatusBadge(activeBooking.status)}</div>
            </div>

            <div className="space-y-4 bg-[#181a25] p-4 rounded-lg border border-[#242735] text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Client</span>
                  <span className="font-semibold text-white">{activeBooking.customer_name}</span>
                </div>
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Phone</span>
                  <span className="font-semibold text-white">{activeBooking.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Service</span>
                  <span className="font-semibold text-white">{activeBooking.service_name}</span>
                </div>
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Barber</span>
                  <span className="font-semibold text-[#dfbe7d]">{activeBooking.barber_name}</span>
                </div>
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Date</span>
                  <span className="font-semibold text-white">{activeBooking.appointment_date}</span>
                </div>
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Time</span>
                  <span className="font-semibold text-white">
                    {activeBooking.start_time} - {activeBooking.end_time}
                  </span>
                </div>
                <div>
                  <span className="text-[#8c8980] block mb-0.5">Total Amount</span>
                  <span className="font-bold text-base text-[#c5a059] tabular-nums">
                    ${activeBooking.price}
                  </span>
                </div>
              </div>

              {activeBooking.customer_notes && (
                <div className="pt-2 border-t border-[#232635]">
                  <span className="text-[#8c8980] block mb-1">Customer Notes</span>
                  <p className="text-stone-300 italic">"{activeBooking.customer_notes}"</p>
                </div>
              )}
            </div>

            {/* Quick Status Control Buttons in Modal */}
            <div className="mt-5 pt-4 border-t border-[#232635]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8980] block mb-2">
                Update Status
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleUpdateStatus(activeBooking.id, 'Confirmed')}
                  className="py-2 text-[11px] font-semibold rounded bg-[#181a24] hover:bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeBooking.id, 'Completed')}
                  className="py-2 text-[11px] font-semibold rounded bg-[#181a24] hover:bg-sky-950 text-sky-400 border border-sky-900/40"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeBooking.id, 'Cancelled')}
                  className="py-2 text-[11px] font-semibold rounded bg-[#181a24] hover:bg-red-950 text-red-400 border border-red-900/40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeBooking.id, 'No-show')}
                  className="py-2 text-[11px] font-semibold rounded bg-[#181a24] hover:bg-amber-950 text-amber-400 border border-amber-900/40"
                >
                  No-show
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
