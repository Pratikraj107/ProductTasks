import { useState } from 'react';
import { Mic, Minimize2, TrendingUp, ArrowRight } from 'lucide-react';
import AnswerCompressionMode from '../components/communication/AnswerCompressionMode';
import ExecutivePresenceMode from '../components/communication/ExecutivePresenceMode';

type Mode = 'landing' | 'compression' | 'presence';

export default function CommunicationLab() {
  const [currentMode, setCurrentMode] = useState<Mode>('landing');

  if (currentMode === 'compression') {
    return <AnswerCompressionMode onBack={() => setCurrentMode('landing')} />;
  }

  if (currentMode === 'presence') {
    return <ExecutivePresenceMode onBack={() => setCurrentMode('landing')} />;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Communication Lab
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Improve your spoken articulation, clarity, executive presence, and conciseness through focused voice drills.
        </p>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
          This is separate from Mock Interview — focused on communication skills, not interview answers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Answer Compression Mode */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              <Minimize2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Answer Compression Mode</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Practice compressing your answers to be more concise and impactful. AI will help you:
          </p>
          <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Answer a PM interview question verbally</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Compress to 2 minutes, then 60 seconds</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>See what fluff was removed and structure improved</span>
            </li>
          </ul>
          <button
            onClick={() => setCurrentMode('compression')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
          >
            <span>Start Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Executive Presence Mode */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Executive Presence Mode</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Analyze and improve your speech patterns for executive presence. AI will evaluate:
          </p>
          <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Fillers (uh, um, like) and speaking speed</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Weak qualifiers ("I think", "maybe")</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Confidence vs uncertainty in delivery</span>
            </li>
          </ul>
          <button
            onClick={() => setCurrentMode('presence')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
          >
            <span>Start Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">1. Select Mode</div>
            <p>Choose a practice mode based on what you want to improve.</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">2. Speak</div>
            <p>Record your response to the prompt or question.</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">3. Get Feedback</div>
            <p>Receive actionable, specific feedback to improve your communication.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
