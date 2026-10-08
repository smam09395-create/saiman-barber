import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Check, X, Scissors } from 'lucide-react';
import { Service } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

interface ServicesTabProps {
  services: Service[];
  onRefresh: () => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({ services, onRefresh }) => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('45');
  const [duration, setDuration] = useState('45');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('50');
    setDuration('45');
    setImage('/src/assets/images/gallery_skin_fade_1791309741240.jpg');
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description);
    setPrice(s.price.toString());
    setDuration(s.duration.toString());
    setImage(s.image || '');
    setActive(Boolean(s.active));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingService) {
        await api.updateService(editingService.id, {
          name,
          description,
          price: Number(price),
          duration: Number(duration),
          image,
          active: active ? 1 : 0,
        });
        showToast('Service updated successfully');
      } else {
        await api.createService({
          name,
          description,
          price: Number(price),
          duration: Number(duration),
          image,
        });
        showToast('New service created successfully');
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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteService(id);
      showToast('Service deleted');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Could not delete service', 'error');
    }
  };

  const handleToggleActive = async (s: Service) => {
    try {
      const newStatus = s.active ? 0 : 1;
      await api.updateService(s.id, { active: newStatus });
      showToast(`${s.name} is now ${newStatus ? 'active' : 'inactive'}`);
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
            Manage Services ({services.length})
          </h3>
          <p className="text-xs text-[#8c8980]">
            Add, update pricing, change durations, or toggle service availability.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 py-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s) => (
          <div
            key={s.id}
            className={`bg-[#12141c] border rounded-xl p-5 flex flex-col justify-between transition-all ${
              s.active
                ? 'border-[#242735] hover:border-[#c5a059]/40'
                : 'border-red-950/40 opacity-70 bg-[#161214]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl font-display font-bold text-[#edebe6] tabular-nums">
                  ${s.price}
                </span>
                <button
                  onClick={() => handleToggleActive(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    s.active
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : 'bg-red-950/60 text-red-400 border border-red-800/50'
                  }`}
                >
                  {s.active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <h4 className="text-base font-semibold text-[#f4f2ed] mb-1.5">{s.name}</h4>
              <p className="text-xs text-[#8c8980] leading-relaxed mb-4">{s.description}</p>
            </div>

            <div className="pt-4 border-t border-[#1f2230] flex items-center justify-between text-xs">
              <span className="text-[#a6a39a] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                <span className="tabular-nums">{s.duration} mins</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 rounded hover:bg-[#1e212f] text-stone-300 hover:text-white"
                  title="Edit Service"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="p-1.5 rounded hover:bg-red-950/50 text-red-400"
                  title="Delete Service"
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
          <div className="bg-[#12141c] border border-[#262939] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-bold text-[#f4f2ed] mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Executive Scissor Finish"
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-sm rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of haircut or grooming process..."
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#181a24] border border-[#282c3c] text-white text-sm rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#181a24] border border-[#282c3c] text-white text-sm rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Image Path / URL
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/src/assets/images/gallery_skin_fade_1791309741240.jpg"
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-[#282c3c] text-[#c5a059]"
                />
                <label htmlFor="activeToggle" className="text-stone-300">
                  Active (Displayed on customer booking form)
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
