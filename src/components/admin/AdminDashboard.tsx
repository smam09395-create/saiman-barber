import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Clock,
  UserCheck,
  Star,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  Plus,
  RefreshCw,
  Database,
  Check,
} from 'lucide-react';
import {
  AdminUser,
  Service,
  Barber,
  Settings,
  Booking,
} from '../../types/index.ts';
import { api, authStorage } from '../../api/client.ts';
import { AppointmentsTab } from './AppointmentsTab.tsx';
import { ServicesTab } from './ServicesTab.tsx';
import { BarbersTab } from './BarbersTab.tsx';
import { AvailabilityTab } from './AvailabilityTab.tsx';
import { CustomersTab } from './CustomersTab.tsx';
import { ReviewsTab } from './ReviewsTab.tsx';
import { SettingsTab } from './SettingsTab.tsx';
import { SupabaseTab } from './SupabaseTab.tsx';
import { useToast } from '../Toast.tsx';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
  onReturnToSite: () => void;
  services: Service[];
  barbers: Barber[];
  settings: Settings;
  onRefreshAll: () => void;
}

type TabType =
  | 'overview'
  | 'appointments'
  | 'services'
  | 'barbers'
  | 'availability'
  | 'customers'
  | 'reviews'
  | 'settings'
  | 'supabase';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  onLogout,
  onReturnToSite,
  services,
  barbers,
  settings,
  onRefreshAll,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState<{
    totalBookings: number;
    todayBookings: number;
    upcomingBookings: number;
    statusCounts: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
      noShow: number;
    };
    revenue: {
      total: number;
      today: number;
    };
    recentBookings: Booking[];
    completedBookings?: Booking[];
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getAdminOverview();
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleQuickComplete = async (id: string) => {
    try {
      await api.updateBookingStatus(id, 'Completed');
      showToast('✓ Order marked as Completed (Synced to Supabase)');
      // Immediately reload overview stats so Today Income and completed orders update live!
      const freshData = await api.getAdminOverview();
      setStats(freshData);
    } catch (err: any) {
      showToast(err.message || 'Could not complete appointment', 'error');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleLogoutClick = async () => {
    try {
      await api.adminLogout();
    } catch {
      // ignore
    }
    authStorage.clearToken();
    showToast('Signed out of management portal');
    onLogout();
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'barbers', label: 'Barbers', icon: Users },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'supabase', label: 'Supabase Cloud', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#edebe6] flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0e1017] border-r border-[#1f2230] p-4 justify-between shrink-0">
        <div>
          {/* Brand Wordmark */}
          <div className="px-3 py-4 mb-4 border-b border-[#1b1e2a] flex items-center justify-between">
            <div>
              <span className="text-xl font-display font-bold tracking-widest text-white block">
                SAIMAN
              </span>
              <span className="text-[10px] font-mono text-[#c5a059] uppercase tracking-wider block">
                Management Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#c5a059] text-[#0a0b0d] font-bold shadow-md shadow-[#c5a059]/15'
                      : 'text-[#8c8980] hover:text-white hover:bg-[#161822]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#1b1e2a] space-y-2">
          <button
            onClick={onReturnToSite}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#8c8980] hover:text-white hover:bg-[#161822] transition-colors"
          >
            <span>Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0e1017]/90 backdrop-blur-md border-b border-[#1f2230] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-stone-300 hover:text-white rounded-lg hover:bg-[#181a25]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-white capitalize">
                {activeTab} Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadStats();
                onRefreshAll();
                showToast('Refreshed data from database');
              }}
              className="p-2 text-[#8c8980] hover:text-white rounded-lg hover:bg-[#171924] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onReturnToSite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161824] border border-[#272a39] text-xs text-[#c5a059] hover:bg-[#1e2130] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Customer Site</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-[#242735]">
              <div className="w-7 h-7 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-xs border border-[#c5a059]/30">
                {admin.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-white hidden md:inline">
                {admin.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Today's Income (Aaj Ki Kamai) - Prominently highlighted */}
                <div className="bg-[#12141c] border-2 border-emerald-500/70 rounded-xl p-5 shadow-xl bg-gradient-to-br from-emerald-950/30 to-[#12141c]">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-1 flex items-center justify-between font-bold">
                    <span>Today's Income</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </span>
                  <div className="text-3xl font-display font-extrabold text-emerald-300 tabular-nums">
                    ${stats?.revenue?.today || 0}
                  </div>
                  <span className="text-[11px] text-emerald-400/90 mt-1 block font-medium">
                    Total payments completed today
                  </span>
                </div>

                {/* 2. Completed Orders */}
                <div className="bg-[#12141c] border border-emerald-900/60 rounded-xl p-5 shadow-lg bg-emerald-950/15">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed Orders</span>
                  </span>
                  <div className="text-3xl font-display font-bold text-emerald-400 tabular-nums">
                    {stats?.statusCounts?.completed || 0}
                  </div>
                  <span className="text-[11px] text-emerald-300/80 mt-1 block">
                    Fulfilled studio appointments
                  </span>
                </div>

                {/* 3. Today's Bookings */}
                <div className="bg-[#12141c] border border-[#232635] rounded-xl p-5 shadow-lg">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980] block mb-1">
                    Today's Bookings
                  </span>
                  <div className="text-3xl font-display font-bold text-[#f4f2ed] tabular-nums">
                    {stats?.todayBookings || 0}
                  </div>
                  <span className="text-[11px] text-[#c5a059] mt-1 block">
                    Appointments scheduled today
                  </span>
                </div>

                {/* 4. Upcoming Queue */}
                <div className="bg-[#12141c] border border-[#232635] rounded-xl p-5 shadow-lg">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980] block mb-1">
                    Upcoming Queue
                  </span>
                  <div className="text-3xl font-display font-bold text-[#f4f2ed] tabular-nums">
                    {stats?.upcomingBookings || 0}
                  </div>
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    Active reservations
                  </span>
                </div>

                {/* 5. Total Lifetime Revenue */}
                <div className="bg-[#12141c] border border-[#232635] rounded-xl p-5 shadow-lg col-span-2 lg:col-span-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8c8980] block mb-1">
                    Total Revenue
                  </span>
                  <div className="text-3xl font-display font-bold text-white tabular-nums">
                    ${stats?.revenue?.total || 0}
                  </div>
                  <span className="text-[11px] text-[#8c8980] mt-1 block">
                    Lifetime studio earnings
                  </span>
                </div>
              </div>

              {/* Dedicated Recently Completed Orders Table */}
              {stats?.completedBookings && stats.completedBookings.length > 0 && (
                <div className="bg-[#12141c] border border-emerald-800/60 rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-4 bg-emerald-950/30 border-b border-emerald-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-bold text-emerald-300">
                          Completed Orders & Payment Added ({stats.completedBookings.length})
                        </h3>
                        <p className="text-[11px] text-emerald-400/80">
                          These appointments are marked Completed and their payments are recorded in your revenue.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-700/60 px-3 py-1.5 rounded-lg">
                      Today's Income: ${stats.revenue.today}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161822] text-[#8c8980] uppercase tracking-wider font-mono border-b border-[#232635]">
                        <tr>
                          <th className="py-2.5 px-4">Ref #</th>
                          <th className="py-2.5 px-4">Customer</th>
                          <th className="py-2.5 px-4">Service</th>
                          <th className="py-2.5 px-4">Barber</th>
                          <th className="py-2.5 px-4">Appointment Date</th>
                          <th className="py-2.5 px-4">Amount Collected</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e212d] text-[#edebe6]">
                        {stats.completedBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-emerald-950/20 bg-emerald-950/10 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-semibold text-[#c5a059]">
                              {b.booking_reference}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-white block">{b.customer_name}</span>
                              <span className="text-[10px] text-[#8c8980]">{b.customer_phone}</span>
                            </td>
                            <td className="py-2.5 px-4">{b.service_name}</td>
                            <td className="py-2.5 px-4 text-[#dfbe7d]">{b.barber_name}</td>
                            <td className="py-2.5 px-4 tabular-nums">
                              {b.appointment_date} at {b.start_time}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-emerald-300 tabular-nums text-sm">
                              +${b.price}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Order Completed</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status Breakdown & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl lg:col-span-2">
                  <h3 className="text-base font-semibold text-white mb-4">
                    Booking Status Distribution
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-lg bg-[#181a25] border border-[#252837] text-center">
                      <span className="text-xs text-[#8c8980] block">Confirmed</span>
                      <span className="text-xl font-bold text-emerald-400 tabular-nums mt-1 block">
                        {stats?.statusCounts?.confirmed || 0}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#181a25] border border-[#252837] text-center">
                      <span className="text-xs text-[#8c8980] block">Completed</span>
                      <span className="text-xl font-bold text-sky-400 tabular-nums mt-1 block">
                        {stats?.statusCounts?.completed || 0}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#181a25] border border-[#252837] text-center">
                      <span className="text-xs text-[#8c8980] block">Pending</span>
                      <span className="text-xl font-bold text-[#c5a059] tabular-nums mt-1 block">
                        {stats?.statusCounts?.pending || 0}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#181a25] border border-[#252837] text-center">
                      <span className="text-xs text-[#8c8980] block">Cancelled</span>
                      <span className="text-xl font-bold text-red-400 tabular-nums mt-1 block">
                        {stats?.statusCounts?.cancelled || 0}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#181a25] border border-[#252837] text-center">
                      <span className="text-xs text-[#8c8980] block">No-show</span>
                      <span className="text-xl font-bold text-amber-400 tabular-nums mt-1 block">
                        {stats?.statusCounts?.noShow || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Management Shortcuts */}
                <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      Quick Operations
                    </h3>
                    <p className="text-xs text-[#8c8980] mb-4">
                      Fast access to frequent studio adjustments.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="w-full text-left p-2.5 rounded-lg bg-[#171924] border border-[#262939] text-[#edebe6] hover:bg-[#1f2230] transition-colors flex items-center justify-between"
                    >
                      <span>Review Live Appointments</span>
                      <Calendar className="w-4 h-4 text-[#c5a059]" />
                    </button>
                    <button
                      onClick={() => setActiveTab('availability')}
                      className="w-full text-left p-2.5 rounded-lg bg-[#171924] border border-[#262939] text-[#edebe6] hover:bg-[#1f2230] transition-colors flex items-center justify-between"
                    >
                      <span>Adjust Barber Shifts</span>
                      <Clock className="w-4 h-4 text-[#c5a059]" />
                    </button>
                    <button
                      onClick={() => setActiveTab('services')}
                      className="w-full text-left p-2.5 rounded-lg bg-[#171924] border border-[#262939] text-[#edebe6] hover:bg-[#1f2230] transition-colors flex items-center justify-between"
                    >
                      <span>Update Service Pricing</span>
                      <Scissors className="w-4 h-4 text-[#c5a059]" />
                    </button>
                    <button
                      onClick={() => setActiveTab('supabase')}
                      className="w-full text-left p-2.5 rounded-lg bg-[#1a1d29] border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#232738] transition-colors flex items-center justify-between font-semibold"
                    >
                      <span>Supabase Cloud Integration</span>
                      <Database className="w-4 h-4 text-[#c5a059]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table preview */}
              <div className="bg-[#12141c] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[#1f2230] flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">
                    Recent Bookings
                  </h3>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs text-[#c5a059] hover:underline"
                  >
                    View All Appointments →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181a25] text-[#8c8980] uppercase tracking-wider font-mono border-b border-[#232635]">
                      <tr>
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Barber</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e212d] text-[#edebe6]">
                      {stats?.recentBookings?.map((b) => (
                        <tr
                          key={b.id}
                          className={`transition-colors ${
                            b.status === 'Completed'
                              ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                              : 'hover:bg-[#181a24]/50'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-semibold text-[#c5a059]">
                            {b.booking_reference}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            {b.customer_name}
                          </td>
                          <td className="py-3 px-4">{b.service_name}</td>
                          <td className="py-3 px-4 text-[#dfbe7d]">{b.barber_name}</td>
                          <td className="py-3 px-4 tabular-nums">
                            {b.appointment_date} at {b.start_time}
                          </td>
                          <td className="py-3 px-4">
                            {b.status === 'Completed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Completed</span>
                              </span>
                            ) : b.status === 'Cancelled' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-400 border border-red-900/60">
                                Cancelled
                              </span>
                            ) : b.status === 'No-show' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-900/60">
                                No-show
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                                {b.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {b.status !== 'Completed' ? (
                              <button
                                onClick={() => handleQuickComplete(b.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors shadow-sm"
                                title="Mark Order as Completed"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <AppointmentsTab barbers={barbers} onStatsRefresh={loadStats} />
          )}

          {activeTab === 'services' && (
            <ServicesTab services={services} onRefresh={onRefreshAll} />
          )}

          {activeTab === 'barbers' && (
            <BarbersTab barbers={barbers} onRefresh={onRefreshAll} />
          )}

          {activeTab === 'availability' && (
            <AvailabilityTab barbers={barbers} />
          )}

          {activeTab === 'customers' && <CustomersTab />}

          {activeTab === 'reviews' && <ReviewsTab />}

          {activeTab === 'settings' && (
            <SettingsTab settings={settings} onRefresh={onRefreshAll} />
          )}

          {activeTab === 'supabase' && <SupabaseTab />}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 lg:hidden flex">
          <div className="w-64 bg-[#0e1017] p-5 flex flex-col justify-between h-full border-r border-[#222533]">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1b1e2a]">
                <span className="text-lg font-display font-bold text-white">
                  SAIMAN
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabType);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-[#c5a059] text-[#0a0b0d] font-bold'
                          : 'text-[#8c8980] hover:text-white hover:bg-[#161822]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#1b1e2a] space-y-2">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  onReturnToSite();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#8c8980]"
              >
                <span>Public Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
