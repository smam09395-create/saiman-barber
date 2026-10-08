import React, { useState } from 'react';
import { Star, MessageSquarePlus, X, CheckCircle2 } from 'lucide-react';
import { Review } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useToast } from './Toast.tsx';

interface ReviewsSectionProps {
  reviews: Review[];
  onReviewAdded: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  onReviewAdded,
}) => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [serviceName, setServiceName] = useState('The Signature: Cut & Beard');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) {
      showToast('Please enter your name and a brief review.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.submitReview({
        customer_name: customerName,
        rating,
        comment,
        service_name: serviceName,
      });
      showToast('Thank you! Your review has been submitted.');
      setCustomerName('');
      setComment('');
      setModalOpen(false);
      onReviewAdded();
    } catch (err: any) {
      showToast(err.message || 'Could not submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 bg-[#0d0e12] border-t border-[#1c1e26] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
              <span>Client Voices</span>
              <span aria-hidden="true">·</span>
              <span>Verified Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight">
              Words From the Chair
            </h2>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#edebe6] bg-[#161820] hover:bg-[#20232d] border border-[#262936] hover:border-[#c5a059]/40 rounded-lg transition-colors self-start md:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4 text-[#c5a059]" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-[#12141a] rounded-xl border border-[#21242e] p-6 flex flex-col justify-between hover:border-[#c5a059]/30 transition-all duration-300 shadow-lg"
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
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

                <p className="text-sm text-[#9e9b92] italic leading-relaxed mb-6">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#1d2028]">
                <h4 className="text-sm font-semibold text-[#edebe6]">
                  {r.customer_name}
                </h4>
                {r.service_name && (
                  <span className="text-xs text-[#7e7b72] block mt-0.5">
                    {r.service_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141b] border border-[#262937] rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-display font-bold text-[#f4f2ed] mb-1">
              Leave a Review
            </h3>
            <p className="text-xs text-[#8c8980] mb-5">
              Share your grooming experience with the SAIMAN community.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c8980] uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Liam Sterling"
                  className="w-full bg-[#171922] border border-[#272a38] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c8980] uppercase tracking-wider mb-1.5">
                  Service Received
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Precision Skin Fade"
                  className="w-full bg-[#171922] border border-[#272a38] text-white text-sm rounded-lg px-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c8980] uppercase tracking-wider mb-1.5">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'fill-[#c5a059] text-[#c5a059]'
                            : 'fill-stone-800 text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-[#8c8980] ml-2">({rating} Stars)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c8980] uppercase tracking-wider mb-1.5">
                  Your Feedback
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the cut, barber technique, and shop atmosphere..."
                  className="w-full bg-[#171922] border border-[#272a38] text-white text-sm rounded-lg p-3 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg font-mono disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
