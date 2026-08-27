import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send, RefreshCw, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitDisruptionReport } from '../services/api';

export default function ReportModal({
  isOpen,
  onClose,
  trainNumber,
  trainName = '',
  stations = [],
  onReportSubmitted = null,
}) {
  const { user, token, isAuthenticated, openLoginModal } = useAuth();

  const [stationCode, setStationCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  // Extra guard: If a logged-out user somehow attempts to render the modal,
  // immediately open the auth modal and close this modal.
  if (!isAuthenticated) {
    openLoginModal();
    onClose();
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 3) {
      setError('Description must be at least 3 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await submitDisruptionReport(
        trainNumber,
        {
          station_code: stationCode || null,
          description: trimmedDesc,
        },
        token
      );

      setSuccessMsg('DISRUPTION_REPORT_RECORDED // CROWDSOURCED_TELEMETRY_UPDATED');
      if (onReportSubmitted) {
        onReportSubmitted(res);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setDescription('');
        setStationCode('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-none"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
          className="relative w-full max-w-lg bg-[#111111] border border-white/20 border-t-2 border-t-transit-red p-6 shadow-2xl z-10 font-sans text-white space-y-5"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Title Bar */}
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-sora uppercase tracking-[0.1em] text-transit-red">
                <span className="w-2 h-2 bg-transit-red inline-block" />
                <span>[ CROWDSOURCED_TELEMETRY ]</span>
              </div>
              <h2 className="font-sora font-bold text-lg text-white tracking-tight">
                REPORT TRACK DISRUPTION
              </h2>
              <p className="text-xs text-white/50 font-mono">
                TRAIN #{trainNumber} {trainName ? `— ${trainName}` : ''}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-white/50 hover:text-white border border-white/10 hover:border-white/30 focus-visible:ring-1 focus-visible:ring-transit-red transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Verified Reporter Identity Pill */}
          <div className="flex items-center justify-between p-2.5 bg-black/60 border border-white/10 text-xs text-white/70 font-sora">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFB300]" />
              <span>VERIFIED REPORTER: <strong className="text-white font-mono">{user?.phone_number || 'OTP_AUTHENTICATED'}</strong></span>
            </div>
            <span className="text-[10px] text-[#FFB300] bg-[#FFB300]/10 px-2 py-0.5 border border-[#FFB300]/30 font-bold uppercase tracking-wider">
              OTP VERIFIED
            </span>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-950/40 border border-emerald-500 text-xs flex items-center gap-2 text-emerald-400 font-sora font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-[#B22222]/15 border border-[#B22222] text-xs text-[#B22222] font-sora space-y-1">
              <div className="font-bold uppercase tracking-wider">[ ERROR // SUBMISSION_FAILED ]</div>
              <p className="font-sans text-white/80">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Station Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-sora font-medium uppercase tracking-wider text-white/70">
                AFFECTED STATION / SECTION (OPTIONAL)
              </label>
              <div className="relative border border-white/20 bg-black focus-within:border-transit-red focus-within:ring-1 focus-within:ring-transit-red transition-colors">
                <div className="flex items-center px-3 py-2 gap-2.5">
                  <MapPin className="w-4 h-4 text-white/40 shrink-0" />
                  <select
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value)}
                    className="w-full bg-black text-white font-sans text-xs sm:text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">-- EN-ROUTE / GENERAL SECTION --</option>
                    {stations.map((stn) => (
                      <option key={stn.code} value={stn.code}>
                        {stn.code} — {stn.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-sora font-medium uppercase tracking-wider text-white/70">
                  INCIDENT DETAILS / REASON *
                </label>
                <span className="text-[10px] text-white/40 font-mono">
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                required
                placeholder="e.g. Signal failure at outer loop, loco speed restricted to 20 km/h, freight rake clearance delay..."
                className="w-full bg-black border border-white/20 p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-transit-red focus:ring-1 focus:ring-transit-red focus:outline-none font-sans resize-none transition-colors"
              />
              <p className="text-[10px] text-white/40 font-sans">
                Reports are aggregated in real time. 3+ verified reports within 3 hours flags this section for all passengers.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-black border border-white/20 hover:border-white/40 text-white font-sora text-xs uppercase tracking-wider transition-colors"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={loading || description.trim().length < 3}
                className="flex-1 py-2.5 bg-transit-red hover:bg-red-700 text-white font-sora font-bold text-xs uppercase tracking-[0.1em] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-transit-red"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>TRANSMITTING_REPORT...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>SUBMIT DISRUPTION REPORT</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Disclaimer */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-white/40 font-sora">
            <span>RAILPULSE // INCIDENT_ATTRIBUTION</span>
            <span>SIH_2026</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

