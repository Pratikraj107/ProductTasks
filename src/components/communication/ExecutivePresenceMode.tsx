import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface PresenceFeedback {
  fillers: {
    count: number;
    examples: string[];
    impact: string;
  };
  speaking_speed: {
    words_per_minute: number;
    assessment: string;
    recommendation: string;
  };
  qualifiers: {
    weak_phrases: string[];
    impact: string;
    replacements: { before: string; after: string }[];
  };
  confidence_indicators: {
    uncertain_endings: number;
    examples: string[];
    improvements: string[];
  };
  overall_assessment: string;
  key_improvements: string[];
}

type Stage = 'prompt' | 'recording' | 'analyzing' | 'feedback';

export default function ExecutivePresenceMode({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('prompt');
  const [prompt, setPrompt] = useState<string>('');
  const [feedback, setFeedback] = useState<PresenceFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pmPrompts = [
    "Explain your approach to product prioritization in 2 minutes.",
    "Describe how you would handle a product launch that's behind schedule.",
    "Walk me through your framework for making product decisions.",
    "Explain how you balance user needs with business goals.",
    "Describe a time you had to say no to a feature request.",
  ];

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * pmPrompts.length);
    setPrompt(pmPrompts[randomIndex]);
  };

  const handleRecordingComplete = async (audioBlob: Blob, transcript: string) => {
    setStage('analyzing');
    setLoading(true);
    setError(null);

    try {
      let finalTranscript = transcript;

      // Try to transcribe using backend (better accuracy)
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const transcribeResponse = await fetch(`${API_BASE_URL}/api/interview/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (transcribeResponse.ok) {
          const transcribeData = await transcribeResponse.json();
          if (transcribeData.transcript) {
            finalTranscript = transcribeData.transcript;
          }
        } else {
          console.warn('Backend transcription failed, using real-time transcript');
        }
      } catch (transcribeErr) {
        console.warn('Backend transcription unavailable, using real-time transcript:', transcribeErr);
        // Continue with real-time transcript if backend is unavailable
      }

      // Validate we have a transcript
      if (!finalTranscript || finalTranscript.trim().length === 0) {
        throw new Error('No transcript available. Please ensure your microphone is working and try again.');
      }

      // Get presence analysis
      const analysisResponse = await fetch(`${API_BASE_URL}/api/communication/analyze-presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          transcript: finalTranscript,
          audio_duration: 0, // Could calculate from audio blob if needed
        }),
      });

      if (!analysisResponse.ok) {
        if (analysisResponse.status === 0 || analysisResponse.status === 503) {
          throw new Error('Backend server is not available. Please make sure the backend server is running on port 8000, or check your VITE_API_BASE_URL environment variable.');
        }
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to analyze speech');
      }

      const analysisData = await analysisResponse.json();
      setFeedback(analysisData);
      setStage('feedback');
    } catch (err: any) {
      console.error('Error analyzing speech:', err);
      const errorMessage = err.message || 'Failed to analyze your speech. Please try again.';
      setError(errorMessage);
      setStage('recording');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStage('recording');
    setFeedback(null);
    setError(null);
  };

  const handleNewPrompt = () => {
    setStage('prompt');
    setPrompt('');
    setFeedback(null);
    setError(null);
  };

  if (stage === 'prompt') {
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Executive Presence Mode</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Answer a short PM prompt. AI will analyze your speech patterns for fillers, qualifiers, 
            speaking speed, and confidence indicators.
          </p>

          {prompt ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Your Prompt:</p>
                <p className="text-slate-700 dark:text-slate-300">{prompt}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStage('recording')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                >
                  Start Answering
                </button>
                <button
                  onClick={getRandomPrompt}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-medium"
                >
                  New Prompt
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={getRandomPrompt}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
            >
              Get Random Prompt
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'recording') {
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Answer the Prompt</h2>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
            <p className="text-slate-700 dark:text-slate-300">{prompt}</p>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Answer this prompt verbally. Focus on speaking clearly and confidently.
          </p>

          <AudioRecorder onRecordingComplete={handleRecordingComplete} />

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'analyzing') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Analyzing your speech...</p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Evaluating fillers, qualifiers, and confidence indicators</p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Executive Presence Analysis</h2>

          {feedback && (
            <div className="space-y-6">
              {/* Overall Assessment */}
              {feedback.overall_assessment && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Overall Assessment</h3>
                  <p className="text-slate-700 dark:text-slate-300">{feedback.overall_assessment}</p>
                </div>
              )}

              {/* Fillers */}
              {feedback.fillers && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Fillers (uh, um, like)
                  </h3>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                      <strong>Count:</strong> {feedback.fillers.count}
                    </p>
                    {feedback.fillers.examples && feedback.fillers.examples.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Examples:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.fillers.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400">{feedback.fillers.impact}</p>
                  </div>
                </div>
              )}

              {/* Speaking Speed */}
              {feedback.speaking_speed && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Speaking Speed</h3>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                      <strong>Words per minute:</strong> {feedback.speaking_speed.words_per_minute}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {feedback.speaking_speed.assessment}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>Recommendation:</strong> {feedback.speaking_speed.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Weak Qualifiers */}
              {feedback.qualifiers && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Weak Qualifiers</h3>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    {feedback.qualifiers.weak_phrases && feedback.qualifiers.weak_phrases.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Found phrases:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.qualifiers.weak_phrases.map((phrase, index) => (
                            <li key={index}>{phrase}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{feedback.qualifiers.impact}</p>
                    {feedback.qualifiers.replacements && feedback.qualifiers.replacements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Better alternatives:</p>
                        <div className="space-y-2">
                          {feedback.qualifiers.replacements.map((replacement, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-red-600 dark:text-red-400 line-through">{replacement.before}</span>
                              <span className="mx-2">→</span>
                              <span className="text-green-600 dark:text-green-400 font-semibold">{replacement.after}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence Indicators */}
              {feedback.confidence_indicators && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Confidence Indicators</h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                      <strong>Uncertain endings detected:</strong> {feedback.confidence_indicators.uncertain_endings}
                    </p>
                    {feedback.confidence_indicators.examples && feedback.confidence_indicators.examples.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Examples:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.confidence_indicators.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.confidence_indicators.improvements && feedback.confidence_indicators.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.confidence_indicators.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Improvements */}
              {feedback.key_improvements && feedback.key_improvements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Key Improvements</h3>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {feedback.key_improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={handleNewPrompt}
              className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-medium"
            >
              New Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
