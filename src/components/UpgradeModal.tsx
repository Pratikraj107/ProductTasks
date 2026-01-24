import { X, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUsage: number;
  usageLimit: number;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  currentUsage,
  usageLimit
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-lg w-full shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400 hover:text-white" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-3">
            You've Reached Your Monthly Limit
          </h3>
          <p className="text-slate-400 mb-4">
            You've completed <span className="font-semibold text-white">{currentUsage} out of {usageLimit} interviews</span> this month.
          </p>
          <p className="text-slate-300 text-lg mb-6">
            Upgrade to unlock <span className="font-bold text-cyan-400">25 interviews per month</span> and continue practicing!
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
          <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span>What you'll get with Paid Plan:</span>
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">25 AI mock interviews per month (5x more than free)</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Full AI-powered feedback on all answers</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Access to all 600+ interview questions</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Real-time transcription and PM framework guidance</span>
            </li>
          </ul>
        </div>

        {/* Pricing Info */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 mb-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Starting at</p>
              <p className="text-2xl font-bold text-white">₹800<span className="text-slate-400 text-lg font-normal">/month</span></p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Or save 37%</p>
              <p className="text-2xl font-bold text-white">₹6,000<span className="text-slate-400 text-lg font-normal">/year</span></p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg transition-all flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all border border-slate-700"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
