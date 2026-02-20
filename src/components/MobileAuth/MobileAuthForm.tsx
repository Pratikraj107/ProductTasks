import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { normalizePhone, isValidLocalPhoneLength, DEFAULT_COUNTRY_CODE, COUNTRY_CODES } from '../../utils/phoneValidation';
import OTPInput from './OTPInput';
import { Smartphone, Loader } from 'lucide-react';

const RESEND_COOLDOWN_SEC = 60;

interface MobileAuthFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

export default function MobileAuthForm({ onSuccess, onBack, className = '' }: MobileAuthFormProps) {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const localDigits = normalizePhone(phone);
  const fullPhoneNumber = `${countryCode}${localDigits}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidLocalPhoneLength(phone)) {
      setError('Enter a valid mobile number (at least 6 digits)');
      return;
    }
    setLoading(true);
    const { error: err } = await sendOtp(fullPhoneNumber);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setStep('otp');
    setOtp('');
    setResendCooldown(RESEND_COOLDOWN_SEC);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    const { error: err } = await verifyOtp(fullPhoneNumber, otp);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onSuccess?.();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    const { error: err } = await sendOtp(fullPhoneNumber);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setResendCooldown(RESEND_COOLDOWN_SEC);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-cyan-400" />
        <span className="text-slate-300 font-medium">Sign in with mobile</span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="mobile-phone" className="block text-sm font-medium text-slate-300 mb-2">
              Mobile number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none cursor-pointer min-w-[120px] appearance-none bg-no-repeat bg-[length:16px] pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
              >
                {COUNTRY_CODES.map(({ code, label }) => (
                  <option key={code} value={code} className="bg-slate-800 text-white">
                    +{code}
                  </option>
                ))}
              </select>
              <input
                id="mobile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Sending OTP...</> : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-slate-400 text-sm text-center">
            We sent a 6-digit code to +{countryCode} ******{localDigits.slice(-4)}
          </p>
          <OTPInput value={otp} onChange={setOtp} length={6} disabled={loading} />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Verifying...</> : 'Verify & Sign in'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-cyan-400 text-sm font-medium hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full text-slate-400 text-sm hover:text-white transition-colors"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
