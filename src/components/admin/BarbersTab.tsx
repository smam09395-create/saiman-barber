import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Calendar, Check, X, User } from 'lucide-react';
import { Barber } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

interface BarbersTabProps {
  barbers: Barber[];
  onRefresh: () => void;
}

export const BarbersTab: React.FC<BarbersTabProps> = ({ barbers, onRefresh }) => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('5 Years Experience');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [workingDays, setWorkingDays] = useState('Monday,Tuesday,Wednesday,Thursday,Friday,Saturday');
  const [availableHours, setAvailableHours] = useState('09:00 - 19:00');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingBarber(null);
    setName('');
    setSpecialty('Master Barber & Stylist');
    setExperience('6 Years Experience');
    setBio('Precision fades and scissors craftsman with an eye for detail.');
    setImage('/src/assets/images/barber_saiman_portrait_1791309696168.jpg');
    setWorkingDays('Monday,Tuesday,Wednesday,Thursday,Friday,Saturday');
    setAvailableHours('09:00 - 19:00');
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Barber) => {
    setEditingBarber(b);
    setName(b.name);
    setSpecialty(b.specialty);
    setExperience(b.experience);
    setBio(b.bio);
    setImage(b.image);
    setWorkingDays(b.working_days);
    setAvailableHours(b.available_hours);
    setActive(Boolean(b.active));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingBarber) {
        await api.updateBarber(editingBarber.id, {
          name,
          specialty,
          experience,
          bio,
          image,
          working_days: workingDays,
          available_hours: availableHours,
          active: active ? 1 : 0,
        });
        showToast('Barber profile updated');
      } else {
        await api.createBarber({
          name,
          specialty,
          experience,
          bio,
          image,
          working_days: workingDays,
          available_hours: availableHours,
        });
        showToast('New barber added successfully');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the roster?`)) return;
    try {
      await api.deleteBarber(id);
      showToast('Barber removed');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Could not delete barber', 'error');
    }
  };

  const handleToggleActive = async (b: Barber) => {
    try {
      const newStatus = b.active ? 0 : 1;
      await api.updateBarber(b.id, { active: newStatus });
      showToast(`${b.name} is now ${newStatus ? 'active' : 'inactive'}`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
            Master Barbers Roster ({barbers.length})
          </h3>
          <p className="text-xs text-[#8c8980]">
            Manage resident craftsmen, specialties, and bio information.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 py-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Barber</span>
        </button>
      </div>

      {/* Barbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barbers.map((b) => (
          <div
            key={b.id}
            className={`bg-[#12141c] border rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
              b.active
                ? 'border-[#242735] hover:border-[#c5a059]/40'
                : 'border-red-950/40 opacity-70 bg-[#161214]'
            }`}
          >
            <div>
              <div className="relative aspect-[4/3] bg-[#1a1c25]">
                <img
                  src={b.image}
                  alt={b.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top filter brightness-90"
                />
                <button
                  onClick={() => handleToggleActive(b)}
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[11px] font-mono shadow-md backdrop-blur-sm ${
                    b.active
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950/80 text-red-300 border border-red-800'
                  }`}
                >
                  {b.active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="p-5">
                <h4 className="text-lg font-display font-bold text-[#f4f2ed] mb-0.5">
                  {b.name}
                </h4>
                <div className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider mb-2">
                  {b.specialty}
                </div>
                <span className="text-[11px] text-[#78756d] block mb-3">
                  {b.experience} · Shift: {b.available_hours}
                </span>
                <p className="text-xs text-[#8c8980] line-clamp-3 leading-relaxed">
                  {b.bio}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[#1f2230] bg-[#151722] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#716e66] truncate max-w-[170px]">
                {b.working_days.split(',').length} Working Days
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="p-1.5 rounded hover:bg-[#1e212f] text-stone-300 hover:text-white"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.name)}
                  className="p-1.5 rounded hover:bg-red-950/50 text-red-400"
                  title="Remove Barber"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#262939] rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-bold text-[#f4f2ed] mb-4">
              {editingBarber ? `Edit Barber: ${editingBarber.name}` : 'Add Master Barber'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rayyan"
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-sm rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                    Specialty Title
                  </label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Fade Specialist"
                    className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8+ Years Experience"
                    className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Portrait Image Path / URL
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/src/assets/images/barber_saiman_portrait_1791309696168.jpg"
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                    Working Days (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    placeholder="Monday,Tuesday,Wednesday..."
                    className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                    Available Hours
                  </label>
                  <input
                    type="text"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    placeholder="09:00 - 19:00"
                    className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Biography & Craft Background
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detailed craftsmanship background..."
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="barberActiveToggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-[#282c3c] text-[#c5a059]"
                />
                <label htmlFor="barberActiveToggle" className="text-stone-300">
                  Active (Receiving customer bookings)
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBarber ? 'Save Changes' : 'Add Barber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
