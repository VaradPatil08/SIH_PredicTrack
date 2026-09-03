import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Phone, KeyRound, User, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { verifyFirebaseToken, getUserProfile } from '../services/api';
import { firebaseAuth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function AuthModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const { t } = useSettings();

  const [step, setStep] = useState(1); // 1: phone input, 2: otp code input
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  if (!isLoginModalOpen) return null;

  const getRecaptchaVerifier = () => {
    if (window.__predictrackRecaptchaVerifier) {
      return window.__predictrackRecaptchaVerifier;
    }

    const verifier = new RecaptchaVerifier(firebaseAuth, 'firebase-send-otp-button', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        try { verifier.clear(); } catch {}
        window.__predictrackRecaptchaVerifier = null;
      },
    });

    window.__predictrackRecaptchaVerifier = verifier;
    return verifier;
  };

  const resetRecaptcha = () => {
    try {
      window.__predictrackRecaptchaVerifier?.clear();
    } catch {}
    window.__predictrackRecaptchaVerifier = null;
  };

  const normalizePhoneNumber = (value) => {
    // Accept common human-friendly formats such as:
    // +91 1234 567 890, +91-1234-567-890, +911234567890, or 1234567890.
    const raw = String(value || '').trim();
    const compact = raw.replace(/[\s().-]/g, '');

    if (/^\+\d{8,15}$/.test(compact)) {
      return compact;
    }

    // Convenience for Indian passengers entering a 10-digit mobile number.
    if (/^\d{10}$/.test(compact)) {
      return `+91${compact}`;
    }

    // Also accept 91XXXXXXXXXX without the leading +.
    if (/^91\d{10}$/.test(compact)) {
      return `+${compact}`;
    }

    return null;
  };

  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    setError(null);

    const cleanedPhone = normalizePhoneNumber(phoneNumber);
    if (!cleanedPhone) {
      setError('Enter a valid phone number, e.g. +91 1234 567 890.');
      return;
    }

    try {
      setLoading(true);
      const verifier = getRecaptchaVerifier();
      const result = await signInWithPhoneNumber(firebaseAuth, cleanedPhone, verifier);
      setConfirmationResult(result);
      setStep(2);
      setOtpCode('');
      setSuccessMsg('Verification code sent by SMS.');
    } catch (err) {
      resetRecaptcha();
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait and try again later.');
      } else if (code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Use E.164 format, e.g. +919876543210.');
      } else if (code === 'auth/quota-exceeded') {
        setError('Firebase SMS quota has been reached. Try again later or use a Firebase test phone number.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Phone sign-in is not enabled in Firebase Authentication.');
      } else {
        setError(err?.message || 'Could not send the verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanedCode = otpCode.trim();
    if (!confirmationResult) {
      setError('Please request a new OTP first.');
      return;
    }
    if (!/^\d{6}$/.test(cleanedCode)) {
      setError({ key: 'invalidOtp' });
      return;
    }

    try {
      setLoading(true);
      const credential = await confirmationResult.confirm(cleanedCode);
      const firebaseIdToken = await credential.user.getIdToken();
      const res = await verifyFirebaseToken(firebaseIdToken, displayName.trim() || null);

      let profile = { id: res.user_id, phone_number: credential.user.phoneNumber, name: displayName.trim() || null };
      try {
        const fetchedProfile = await getUserProfile(res.access_token);
        if (fetchedProfile) profile = fetchedProfile;
      } catch {
        // Fallback to basic profile
      }

      login(res.access_token, profile);
      setSuccessMsg('Authentication successful.');

      setTimeout(() => {
        closeLoginModal();
        resetRecaptcha();
        setStep(1);
        setOtpCode('');
        setConfirmationResult(null);
        setSuccessMsg(null);
      }, 700);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please check the SMS and try again.');
      } else if (code === 'auth/code-expired') {
        setError('This OTP has expired. Request a new one.');
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError(t('invalidOtp'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    closeLoginModal();
    setStep(1);
    setOtpCode('');
    setConfirmationResult(null);
    resetRecaptcha();
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Soft Dim Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-2xl p-6 z-10 font-sans text-foreground dark:text-slate-100 space-y-5"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-border dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy dark:bg-blue-600 text-white shadow-xs">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-navy dark:text-blue-400 tracking-tight">
                  {t('loginTitle')}
                </h2>
                <p className="text-xs text-muted dark:text-slate-400">
                  {t('loginSubtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted hover:text-navy dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-800 dark:text-red-300 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <div className="font-semibold">{t('notice')}</div>
                <div className="text-red-700 dark:text-red-300">{typeof error === 'string' ? error : (error.fallback || t(error.key, error.params))}</div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Phone Number Input */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground dark:text-slate-200">
                  {t('phoneNumber')}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-foreground dark:text-slate-100 placeholder:text-muted dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500 focus:border-navy dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono tracking-wide"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                id="firebase-send-otp-button"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-navy hover:bg-navy-light dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs active:scale-98"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('requestingOtp')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('requestOtp')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: 6-Digit OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              
              {devOtp && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-navy dark:text-blue-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-navy dark:text-blue-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span>{t('brandBadge')}</span>
                  </div>
                  <p className="text-muted dark:text-slate-400 text-[11px]">
                    {t('devOtpNotice', { otp: devOtp })}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground dark:text-slate-200">
                    {t('enterOtp')}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setConfirmationResult(null); setError(null); }}
                      className="text-xs text-navy dark:text-blue-400 hover:text-navy-light dark:hover:text-blue-300 font-semibold hover:underline"
                    >
                      Change Number
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRequestOTP}
                      className="text-xs text-navy dark:text-blue-400 hover:text-navy-light dark:hover:text-blue-300 font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-foreground dark:text-slate-100 placeholder:text-muted dark:placeholder:text-slate-500 text-center font-mono font-bold text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500 focus:border-navy dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Optional Display Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground dark:text-slate-200">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-foreground dark:text-slate-100 placeholder:text-muted dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500 focus:border-navy dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-lg border border-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground dark:text-slate-200 font-semibold text-xs transition-colors active:scale-98"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-navy hover:bg-navy-light dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs active:scale-98"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('verifying')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t('verifyLogin')}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* Footer Transparency Info */}
          <div className="pt-2 border-t border-border dark:border-slate-800 flex items-center justify-between text-[11px] text-muted dark:text-slate-400">
            <span>{t('brandTitle')}</span>
            <span>{t('evaluationReady')}</span>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
}