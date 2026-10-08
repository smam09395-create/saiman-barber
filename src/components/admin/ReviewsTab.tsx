import React, { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, Plus, MessageSquare } from 'lucide-react';
import { Review } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

export const ReviewsTab: React.FC = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // New review modal
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [serviceName, setServiceName] = useState('Classic Haircut');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.getReviews(true); // true = all including unapproved
      setReviews(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleApprove = async (r: Review) => {
    try {
      const nextApproved = !r.approved;
      await api.approveReview(r.id, nextApproved);
      setReviews((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, approved: nextApproved ? 1 : 0 } : item))
      );
      showToast(`Review ${nextApproved ? 'approved and published' : 'hidden from public view'}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update review status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await api.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Review deleted');
    } catch (err: any) {
      showToast(err.message || 'Could not delete review', 'error');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) {
      showToast('Name and comment are required', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await api.submitReview({
        customer_name: customerName,
        rating,
        service_name: serviceName,
        comment,
      });
      showToast('Review added to system');
      setCustomerName('');
      setComment('');
      setModalOpen(false);
      loadReviews();
    } catch (err: any) {
      showToast(err.message || 'Failed to add review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-[#f4f2ed]">
            Client Reviews Moderation ({reviews.length})
          </h3>
          <p className="text-xs text-[#8c8980]">
            Review client testimonials, approve submissions for the homepage, or publish new verified reviews.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 py-2 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      <div className="bg-[#13151e] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#8c8980]">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8c8980]">
            No reviews submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-[#1e212d]">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181a24]/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {r.customer_name}
                    </span>
                    {r.service_name && (
                      <span className="text-xs text-[#8c8980]">({r.service_name})</span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        r.approved
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-900/40'
                          : 'bg-amber-950/70 text-amber-400 border border-amber-900/40'
                      }`}
                    >
                      {r.approved ? 'Live on Site' : 'Pending / Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating
                            ? 'fill-[#c5a059] text-[#c5a059]'
                            : 'fill-stone-800 text-stone-700'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-stone-300 italic leading-relaxed">
                    "{r.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleApprove(r)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                      r.approved
                        ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {r.approved ? 'Hide from Site' : 'Approve Review'}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded hover:bg-red-950/50 text-red-400"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Modal */}
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
              Add Verified Testimonial
            </h3>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sterling Hayes"
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-sm rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Service Rendered
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. The Signature: Cut & Beard"
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                >
                  <option value={5}>5 Stars (Exceptional)</option>
                  <option value={4}>4 Stars (Very Good)</option>
                  <option value={3}>3 Stars (Average)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#8c8980] mb-1">
                  Customer Review Quote
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Testimonial text..."
                  className="w-full bg-[#181a24] border border-[#282c3c] text-white text-xs rounded-lg p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Publish Testimonial'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
