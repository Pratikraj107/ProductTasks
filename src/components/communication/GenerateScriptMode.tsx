import { useState } from 'react';
import { ArrowLeft, RefreshCw, FileText, Minimize2, TrendingUp } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import AnswerCompressionMode from './AnswerCompressionMode';
import ExecutivePresenceMode from './ExecutivePresenceMode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ScriptSection {
  heading: string;
  content: string;
  subsections?: string[];
}

interface GeneratedScript {
  title: string;
  script_content: string;
  sections: ScriptSection[];
  key_points: string[];
  tips: string[];
  estimated_time: string;
  script_type: string;
}

type Stage = 'select' | 'generating' | 'review' | 'practice-mode' | 'practicing';

export default function GenerateScriptMode({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('select');
  const [scriptType, setScriptType] = useState<string>('');
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [selectedPracticeMode, setSelectedPracticeMode] = useState<'compression' | 'presence' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scriptTypes = [
    { 
      id: 'interview_question', 
      label: 'PM Interview Question', 
      description: 'Practice answering realistic PM interview questions',
      icon: '💼'
    },
    { 
      id: 'presentation_prompt', 
      label: 'Presentation Prompt', 
      description: 'Practice presenting to stakeholders or executives',
      icon: '📊'
    },
    { 
      id: 'star_scenario', 
      label: 'STAR Story Scenario', 
      description: 'Practice telling structured STAR stories',
      icon: '⭐'
    },
    { 
      id: 'elevator_pitch', 
      label: 'Elevator Pitch', 
      description: 'Practice concise, impactful pitches',
      icon: '🚀'
    },
  ];

  const handleGenerateScript = async (type: string) => {
    setScriptType(type);
    setStage('generating');
    setLoading(true);
    setError(null);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 75000); // 75 second timeout

      const response = await fetch(`${API_BASE_URL}/api/communication/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script_type: type }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 0 || response.status === 503) {
          throw new Error('Backend server is not available. Please make sure the backend server is running on port 8000.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate script');
      }

      const scriptData = await response.json();
      setScript(scriptData);
      setStage('review');
    } catch (err: any) {
      console.error('Error generating script:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. The script generation is taking too long. Please try again.');
      } else if (err.message.includes('timeout') || err.message.includes('timed out')) {
        setError('Script generation timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to generate script. Please try again.');
      }
      setStage('select');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = (mode: 'compression' | 'presence') => {
    setSelectedPracticeMode(mode);
    setStage('practicing');
  };

  const handleBackToReview = () => {
    setStage('review');
    setSelectedPracticeMode(null);
  };

  // If practicing with compression mode
  if (stage === 'practicing' && selectedPracticeMode === 'compression' && script) {
    return (
      <AnswerCompressionMode 
        onBack={handleBackToReview}
        scriptData={script}
      />
    );
  }

  // If practicing with presence mode
  if (stage === 'practicing' && selectedPracticeMode === 'presence' && script) {
    return (
      <ExecutivePresenceMode 
        onBack={handleBackToReview}
        scriptData={script}
      />
    );
  }

  if (stage === 'select') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Communication Lab</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Generate Practice Script</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Choose a script type to generate. You'll get a structured script with tips, key points, and guidance to practice with.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scriptTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleGenerateScript(type.id)}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{type.label}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{type.description}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'generating') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Generating your script...</p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Creating a structured practice script with tips and guidance</p>
        </div>
      </div>
    );
  }

  if (stage === 'review' && script) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Communication Lab</span>
        </button>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{script.title}</h2>
              <button
                onClick={() => handleGenerateScript(scriptType)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Generate New</span>
              </button>
            </div>

            {script.estimated_time && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Estimated Practice Time:</strong> {script.estimated_time}
                </p>
              </div>
            )}

            {/* Main Script Content - Full Readable Script (Displayed First) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">📖 Full Script</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  Read this first
                </span>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <div className="text-lg leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-normal">
                    {script.script_content}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 italic text-center">
                👆 Read through this complete script. When ready, scroll down to practice and get feedback.
              </p>
            </div>

            {/* Sections - Structure & Guidance */}
            {script.sections && script.sections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">📋 Structure & Guidance</h3>
                <div className="space-y-4">
                  {script.sections.map((section, index) => (
                    <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{section.heading}</h4>
                      <p className="text-slate-700 dark:text-slate-300 mb-2">{section.content}</p>
                      {section.subsections && section.subsections.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {section.subsections.map((sub, subIndex) => (
                            <li key={subIndex}>{sub}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Points */}
            {script.key_points && script.key_points.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Key Points to Cover</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                  {script.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {script.tips && script.tips.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Tips for Delivery</h3>
                <div className="space-y-2">
                  {script.tips.map((tip, index) => (
                    <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-slate-700 dark:text-slate-300 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Mode Selection */}
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ready to Practice?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Choose a practice mode to get AI feedback on your delivery:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleStartPractice('compression')}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  <Minimize2 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Answer Compression</div>
                    <div className="text-sm opacity-90">Practice compressing your answer</div>
                  </div>
                </button>
                <button
                  onClick={() => handleStartPractice('presence')}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <TrendingUp className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Executive Presence</div>
                    <div className="text-sm opacity-90">Analyze speech patterns</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
