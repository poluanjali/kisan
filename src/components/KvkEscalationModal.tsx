import React, { useState } from 'react';
import { ShieldAlert, Phone, Send, CheckCircle2, UserCheck, Clock, MapPin, Building2, AlertTriangle, X, FileText, Sparkles } from 'lucide-react';
import { CropSoilAnalysisResult, KvkEscalationTicket } from '../types';
import { formatBilingual } from '../utils/translations';

interface KvkEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: CropSoilAnalysisResult;
  diagnosisResult?: CropSoilAnalysisResult;
  photoUrl?: string;
  farmerDistrict?: string;
  currentLanguage?: any;
}

export const KvkEscalationModal: React.FC<KvkEscalationModalProps> = ({
  isOpen,
  onClose,
  result,
  diagnosisResult,
  photoUrl,
  farmerDistrict = 'Nashik',
  currentLanguage,
}) => {
  const activeResult = result || diagnosisResult;
  const [district, setDistrict] = useState(farmerDistrict);
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmerNotes, setFarmerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState<KvkEscalationTicket | null>(
    activeResult?.kvkEscalation || null
  );
  const [whatsappLink, setWhatsappLink] = useState('');

  // Keep ticket in sync if diagnosisResult or result changes
  React.useEffect(() => {
    const esc = activeResult?.kvkEscalation;
    if (esc) {
      setTicket(esc);
      if (esc.whatsappLink) {
        setWhatsappLink(esc.whatsappLink);
      }
    }
  }, [activeResult]);

  // Close on Escape key press
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kvk-escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: activeResult?.detectedEntity || 'Crop Specimen',
          symptoms: activeResult?.earlyDiseaseSignals?.join(', ') || activeResult?.conditionSummary || 'Field symptoms observed',
          confidenceScore: activeResult?.confidenceScore || 68,
          farmerDistrict: district,
          farmerPhone,
          farmerNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setTicket(data.ticket);
        setWhatsappLink(data.ticket.whatsappLink || '');
      }
    } catch (err) {
      console.error('KVK escalation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidenceScore = activeResult?.confidenceScore ?? 68;
  const certaintyLevel = activeResult?.aiCertaintyLevel || (confidenceScore >= 80 ? 'high' : confidenceScore >= 70 ? 'moderate' : 'low');
  const detectedEntity = activeResult?.detectedEntity || 'Field Crop Specimen';
  const scientificName = activeResult?.scientificOrLocalName || 'Botanical sample';
  const modeLabel = (activeResult?.mode || 'crop').toUpperCase();
  const kvkReason = activeResult?.kvkReason || 'Atypical visual symptoms detected. A certified human agricultural scientist from your district KVK will review the specimen to prevent incorrect chemical sprays.';

  return (
    <div
      id="kvk-escalation-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex justify-center items-start sm:items-center p-2 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Floating omnipresent close button in top corner for emergency exit */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-3 sm:top-5 sm:right-6 z-60 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-stone-900/90 hover:bg-black active:bg-stone-950 text-white text-xs font-bold shadow-2xl border border-white/30 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-transform hover:scale-105"
        title="Close (Escape)"
        aria-label="Close modal"
      >
        <X className="w-4 h-4 text-amber-300" />
        <span>{formatBilingual('Close (Esc)', 'close', currentLanguage?.code || 'en')}</span>
      </button>

      <div
        className="relative bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-amber-300 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header - NEVER pushed out of view */}
        <div className="sticky top-0 z-30 shrink-0 bg-gradient-to-r from-amber-800 via-amber-900 to-stone-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shadow-md border-b border-amber-700/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400 text-amber-950">
                  Govt KVK Referral
                </span>
                <span className="text-[11px] text-amber-200/90 font-medium">ICAR / KAU Network</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                Human Agronomist Escalation
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-sm"
            title="Close Window (Esc)"
            aria-label="Close window"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">

          {/* AI Confidence Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950">
              <p className="font-bold">
                AI Diagnostic Confidence:{' '}
                <span className={confidenceScore >= 75 ? 'text-emerald-700' : 'text-amber-800'}>
                  {confidenceScore}% ({certaintyLevel === 'high' ? 'High' : certaintyLevel === 'moderate' ? 'Moderate' : 'Uncertain / Ambiguous'})
                </span>
              </p>
              <p className="text-amber-900/90 mt-1 leading-relaxed">
                {kvkReason}
              </p>
            </div>
          </div>

          {!ticket ? (
            /* Escalation Form */
            <form onSubmit={handleEscalate} className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Specimen Details</p>
                <div className="flex items-center gap-3">
                  {photoUrl && (
                    <img src={photoUrl} alt="Sample" className="w-14 h-14 rounded-xl object-cover border border-gray-300 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{detectedEntity}</h4>
                    <p className="text-xs text-gray-600 line-clamp-1">{scientificName}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Mode: {modeLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    District / Taluka
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Nashik, Pune, Guntur"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Farmer Phone (for KVK Callback)
                  </label>
                  <input
                    type="tel"
                    required
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Field Observations / Chemical History (Optional)
                </label>
                <textarea
                  rows={2}
                  value={farmerNotes}
                  onChange={(e) => setFarmerNotes(e.target.value)}
                  placeholder="e.g., Symptoms appeared 3 days after unseasonal rain; already tried Mancozeb with no response."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Assigning Nearest KVK Scientist...</span>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Generate Official KVK Referral & Connect Agronomist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Ticket Active State */
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-4.5">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>KVK Referral Ticket Active</span>
                  </div>
                  <span className="font-mono text-xs font-black bg-emerald-700 text-white px-2.5 py-1 rounded-lg">
                    {ticket.ticketId}
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs sm:text-sm text-emerald-950">
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-bold">Assigned Agronomist:</strong> {ticket.agronomistName} ({ticket.specialization})
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-bold">Center:</strong> {ticket.kvkCenter}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-bold">Callback Schedule:</strong> {ticket.scheduledTime || 'Within 2 Hours'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-emerald-900 bg-white/80 p-3 rounded-xl border border-emerald-200 mt-3.5 font-medium leading-relaxed">
                  {ticket.agronomistNotes}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>WhatsApp Case Details</span>
                  </a>
                )}
                <a
                  href={`tel:${ticket.phone || '18001801551'}`}
                  className="py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Call KVK Helpline Now</span>
                </a>
              </div>

              {/* Physical Specimen submission instructions */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-xs text-gray-700 space-y-2">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  KVK Physical Sample Guidelines:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                  <li>Cut 3-4 freshly infected leaves showing the transition boundary between green & diseased tissue.</li>
                  <li>Do not wash with water; gently place between dry newspaper sheets in an aerated ziplock.</li>
                  <li>Mention ticket ID <strong>{ticket.ticketId}</strong> when presenting at the KVK reception desk.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Kisan Call Centre Info */}
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-100 p-3 rounded-xl">
            <span className="flex items-center gap-1 font-semibold text-gray-700">
              <Phone className="w-3.5 h-3.5 text-emerald-700" /> National Kisan Call Centre:
            </span>
            <span className="font-bold text-emerald-900">1800-180-1551 (Toll-Free, 6 AM - 10 PM)</span>
          </div>

        </div>

        {/* Persistent Bottom Bar with Explicit Close Button */}
        <div className="sticky bottom-0 z-20 shrink-0 bg-stone-100/95 backdrop-blur-xs border-t border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="hidden sm:inline text-xs text-stone-500 font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-stone-200 border border-stone-300 rounded text-[11px] font-mono text-stone-700">Esc</kbd> or click outside to dismiss
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-900 active:bg-black text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>{formatBilingual('Close Window', 'close', currentLanguage?.code || 'en')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
