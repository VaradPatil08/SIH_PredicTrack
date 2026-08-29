import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send, RefreshCw, CheckCircle2, ShieldCheck, MapPin, Radio } from 'lucide-react';
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

      setSuccessMsg('Report submitted successfully. Thank you for helping fellow passengers!');
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
        {/* Soft Dim Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-xl border border-border shadow-2xl p-6 z-10 font-sans text-foreground space-y-5"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-transit-red border border-red-200 shadow-xs">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-navy tracking-tight">
                  Report Delay or Issue
                </h2>
                <p className="text-xs text-muted">
                  Train #{trainNumber} {trainName ? `— ${trainName}` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Verified Reporter Identity */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-border rounded-lg text-xs text-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-transit-green" />
              <span>Verified Passenger: <strong className="text-foreground font-mono">{user?.phone_number || 'OTP Verified'}</strong></span>
            </div>
            <span className="text-[11px] font-semibold text-navy bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center gap-2 text-emerald-800 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold">Submission Error</div>
                <div className="text-red-700">{error}</div>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Station Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Affected Station / Section (Optional)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-border bg-slate-50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy focus:bg-white cursor-pointer transition-all appearance-none"
                >
                  <option value="">En-route / General Section</option>
                  {stations.map((stn) => (
                    <option key={stn.code} value={stn.code}>
                      {stn.code} — {stn.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-foreground">
                  Details / Reason *
                </label>
                <span className="text-[11px] text-muted font-mono">
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                required
                placeholder="e.g. Train stopped outside station, signal clearance delay, speed caution, heavy rain..."
                className="w-full p-3 rounded-lg border border-border bg-slate-50 text-foreground placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy focus:bg-white resize-none transition-all"
              />
              <p className="text-[11px] text-muted">
                Passenger reports help keep arrival times and delay information accurate for everyone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-border hover:bg-slate-100 text-foreground font-semibold text-xs transition-colors active:scale-98"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || description.trim().length < 3}
                className="flex-1 py-2.5 rounded-lg bg-railway-red hover:bg-railway-dark text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs active:scale-98"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
            <span>Passenger Updates</span>
            <span>Indian Railways Train Enquiry</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

