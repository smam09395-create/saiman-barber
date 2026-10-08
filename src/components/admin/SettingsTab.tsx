import React, { useState, useEffect } from 'react';
import { Save, Store, Phone, Mail, MapPin, Clock, FileText, Check } from 'lucide-react';
import { Settings } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

interface SettingsTabProps {
  settings: Settings;
  onRefresh: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onRefresh }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(formData);
      showToast('Website settings saved successfully');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
          Studio & Website Configuration
        </h3>
        <p className="text-xs text-[#8c8980]">
          Manage public brand attributes, operating hours, phone numbers, and marketing headlines.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand & Copy */}
        <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl space-y-4 text-xs">
          <h4 className="text-sm font-semibold text-[#f4f2ed] border-b border-[#1f2230] pb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#c5a059]" />
            <span>Brand Identity & Headlines</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Studio Brand Name
              </label>
              <input
                type="text"
                value={formData.business_name || ''}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Hero Display Headline
              </label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
              Hero Supporting Subheading
            </label>
            <textarea
              rows={2}
              value={formData.hero_subheading || ''}
              onChange={(e) => handleChange('hero_subheading', e.target.value)}
              className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
              About Section Narrative
            </label>
            <textarea
              rows={4}
              value={formData.about_text || ''}
              onChange={(e) => handleChange('about_text', e.target.value)}
              className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
            />
          </div>
        </div>

        {/* Contact & Hours */}
        <div className="bg-[#12141c] border border-[#232635] rounded-xl p-6 shadow-xl space-y-4 text-xs">
          <h4 className="text-sm font-semibold text-[#f4f2ed] border-b border-[#1f2230] pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c5a059]" />
            <span>Contact & Operating Hours</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Concierge Phone Number
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Concierge Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Mon - Fri Hours
              </label>
              <input
                type="text"
                value={formData.hours_weekday || ''}
                onChange={(e) => handleChange('hours_weekday', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Saturday Hours
              </label>
              <input
                type="text"
                value={formData.hours_saturday || ''}
                onChange={(e) => handleChange('hours_saturday', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                Sunday Hours
              </label>
              <input
                type="text"
                value={formData.hours_sunday || ''}
                onChange={(e) => handleChange('hours_sunday', e.target.value)}
                className="w-full bg-[#181a24] border border-[#282c3c] text-white rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors font-mono disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Website Settings'}</span>
        </button>
      </form>
    </div>
  );
};
