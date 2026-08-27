import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Phone, KeyRound, User, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestOTP, verifyOTP, getUserProfile } from '../services/api';

export default function AuthModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();

  const [step, setStep] = useState(1); // 1: phone input, 2: otp code input
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isLoginModalOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanedPhone = phoneNumber.trim();
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +919876543210).');
      return;
    }

    try {
      setLoading(true);
      const res = await requestOTP(cleanedPhone);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
        setOtpCode(res.dev_otp);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanedCode = otpCode.trim();
    if (cleanedCode.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOTP(phoneNumber.trim(), cleanedCode, displayName.trim() || null);
      
      let profile = { id: res.user_id, phone_number: phoneNumber.trim(), name: displayName.trim() || null };
      try {
        const fetchedProfile = await getUserProfile(res.access_token);
        if (fetchedProfile) profile = fetchedProfile;
      } catch {
        // Fallback to basic profile
      }

      login(res.access_token, profile);
      setSuccessMsg('AUTHENTICATION_SUCCESSFUL // TOKEN_STORED');
      
      setTimeout(() => {
        closeLoginModal();
        setStep(1);
        setOtpCode('');
        setDevOtp(null);
        setSuccessMsg(null);
      }, 700);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    closeLoginModal();
    setStep(1);
    setOtpCode('');
    setDevOtp(null);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-none"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
          className="relative w-full max-w-md bg-[#111111] border border-white/20 border-t-2 border-t-[#FFB300] p-6 shadow-2xl z-10 font-sans text-white space-y-5"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Title Bar */}
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-sora uppercase tracking-[0.1em] text-[#FFB300]">
                <span className="w-2 h-2 bg-[#FFB300] inline-block" />
                <span>[ AUTHENTICATION_GATEWAY ]</span>
              </div>
              <h2 className="font-sora font-bold text-lg text-white tracking-tight">
                RAILPULSE // USER LOGIN
              </h2>
            </div>

            <button
              onClick={handleClose}
              className="p-1 text-white/50 hover:text-white border border-white/10 hover:border-white/30 focus-visible:ring-1 focus-visible:ring-[#FFB300] transition-colors"
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
              className="p-3 bg-[#FFB300]/10 border border-[#FFB300] text-xs flex items-center gap-2 text-[#FFB300] font-sora font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-[#B22222]/15 border border-[#B22222] text-xs text-[#B22222] font-sora space-y-1">
              <div className="font-bold uppercase tracking-wider">[ ERROR // VALIDATION_FAILED ]</div>
              <p className="font-sans text-white/80">{error}</p>
            </div>
          )}

          {/* Step 1: Phone Number Input */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-sora font-medium uppercase tracking-wider text-white/70">
                  MOBILE_PHONE_NUMBER [E.164]
                </label>
                <div className="relative border border-white/20 bg-black focus-within:border-[#FFB300] focus-within:ring-1 focus-within:ring-[#FFB300] transition-colors">
                  <div className="flex items-center px-3 py-2 gap-2.5">
                    <Phone className="w-4 h-4 text-white/40 shrink-0" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full bg-transparent text-white font-sans text-xs sm:text-sm tracking-wider focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/40 font-sans">
                  Enter your mobile number with country code. Used for login & saved train preferences.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-black border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white font-sora font-bold text-xs uppercase tracking-[0.1em] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>TRANSMITTING_OTP...</span>
                  </>
                ) : (
                  <>
                    <span>REQUEST_OTP_CODE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: 6-Digit OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              
              {/* TODO: In production deployment, remove dev_otp display; SMS delivery will be handled by provider */}
              {devOtp && (
                <div className="p-3 bg-black border border-[#FFB300] text-xs space-y-1">
                  <div className="font-sora font-bold text-[#FFB300] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#FFB300] inline-block" />
                    <span>[ DEV_MODE: OTP_GENERATED ]</span>
                  </div>
                  <p className="text-white/80 font-sans text-xs">
                    DEV: your verification code is <strong className="text-[#FFB300] font-mono tracking-widest text-sm">{devOtp}</strong>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-sora font-medium uppercase tracking-wider text-white/70">
                    6-DIGIT_OTP_CODE
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); }}
                    className="text-[10px] text-[#FFB300] font-sora uppercase hover:underline"
                  >
                    CHANGE_PHONE
                  </button>
                </div>

                <div className="relative border border-white/20 bg-black focus-within:border-[#FFB300] focus-within:ring-1 focus-within:ring-[#FFB300] transition-colors">
                  <div className="flex items-center px-3 py-2 gap-2.5">
                    <KeyRound className="w-4 h-4 text-white/40 shrink-0" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-transparent text-white font-mono font-bold text-sm tracking-widest focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              {/* Optional Display Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-sora font-medium uppercase tracking-wider text-white/70">
                  DISPLAY_NAME (OPTIONAL)
                </label>
                <div className="relative border border-white/20 bg-black focus-within:border-[#FFB300] focus-within:ring-1 focus-within:ring-[#FFB300] transition-colors">
                  <div className="flex items-center px-3 py-2 gap-2.5">
                    <User className="w-4 h-4 text-white/40 shrink-0" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="E.G. VARAD PATIL"
                      className="w-full bg-transparent text-white font-sans text-xs sm:text-sm tracking-wide focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-black border border-white/20 hover:border-white/40 text-white font-sora text-xs uppercase tracking-wider transition-colors"
                >
                  BACK
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-black border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white font-sora font-bold text-xs uppercase tracking-[0.1em] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>VERIFYING_CODE...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>VERIFY & AUTHENTICATE</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* Footer Transparency Disclaimer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-sora">
            <span>SECURE_JWT // HS256</span>
            <span>SIH_2026_AUTH</span>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
}