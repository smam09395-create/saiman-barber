import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, DollarSign, Clock, X, ChevronRight } from 'lucide-react';
import { CustomerSummary, Booking } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

export const CustomersTab: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected customer history modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Booking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminCustomers();
      setCustomers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomer = async (c: CustomerSummary) => {
    try {
      setSelectedCustomer(c);
      setLoadingHistory(true);
      const history = await api.getCustomerHistory(c.customer_phone);
      setCustomerHistory(history);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customer history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
          Client Directory ({customers.length})
        </h3>
        <p className="text-xs text-[#8c8980]">
          Aggregated profiles, appointment frequencies, and total lifetime spend generated from bookings.
        </p>
      </div>

      <div className="bg-[#13151e] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#8c8980]">
            Loading clients...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8c8980]">
            No client records registered yet. New bookings will automatically populate this directory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181a25] text-[#8c8980] uppercase tracking-wider font-mono border-b border-[#232635]">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Total Visits</th>
                  <th className="py-3 px-4">Last Appointment</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4 text-right">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e212d] text-[#edebe6]">
                {customers.map((c) => (
                  <tr
                    key={c.customer_phone}
                    onClick={() => handleOpenCustomer(c)}
                    className="hover:bg-[#181a24]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {c.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#8c8980]">
                      {c.customer_phone}
                    </td>
                    <td className="py-3.5 px-4 text-[#8c8980]">
                      {c.customer_email || '—'}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums font-bold text-[#c5a059]">
                      {c.total_appointments} visits
                    </td>
                    <td className="py-3.5 px-4 tabular-nums font-mono">
                      {c.last_appointment}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums font-bold text-emerald-400">
                      ${c.total_spent}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c5a059] hover:underline">
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Booking History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#252837] rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[11px] font-mono text-[#c5a059] uppercase tracking-wider block">
                Client History
              </span>
              <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
                {selectedCustomer.customer_name}
              </h3>
              <p className="text-xs text-[#8c8980] mt-0.5">
                {selectedCustomer.customer_phone} · Total spend: ${selectedCustomer.total_spent}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="p-8 text-center text-xs text-[#8c8980]">
                  Loading client history...
                </div>
              ) : customerHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8c8980]">
                  No appointment records found.
                </div>
              ) : (
                customerHistory.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-lg bg-[#181a25] border border-[#252837] text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[#c5a059]">
                          {b.booking_reference}
                        </span>
                        <span className="text-white font-medium">{b.service_name}</span>
                      </div>
                      <div className="text-[#8c8980] flex items-center gap-2">
                        <span>{b.appointment_date} at {b.start_time}</span>
                        <span>·</span>
                        <span className="text-[#dfbe7d]">{b.barber_name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-white tabular-nums">${b.price}</div>
                      <span className="text-[10px] text-stone-400">{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
