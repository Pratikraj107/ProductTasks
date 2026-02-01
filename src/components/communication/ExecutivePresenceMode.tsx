import { useState, useEffect } from 'react';
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
  tone_and_emphasis?: {
    assessment: string;
    strengths: string[];
    improvements: string[];
  };
  pauses_and_pacing?: {
    assessment: string;
    strengths: string[];
    improvements: string[];
  };
  pronunciation_and_clarity?: {
    assessment: string;
    strengths: string[];
    improvements: string[];
  };
  content_quality?: {
    structure: string;
    completeness: string;
    relevance: string;
    improvements: string[];
  };
  overall_assessment: string;
  key_improvements: string[];
}

type Stage = 'prompt' | 'generating-answer' | 'reading' | 'recording' | 'analyzing' | 'feedback';

interface ScriptData {
  script_content: string;
  script_type: string;
  sections?: Array<{ heading: string; content: string; subsections?: string[] }>;
  key_points?: string[];
  tips?: string[];
  title?: string;
}

interface ExecutivePresenceModeProps {
  onBack: () => void;
  customPrompt?: string;
  scriptData?: ScriptData;
}

export default function ExecutivePresenceMode({ onBack, customPrompt, scriptData }: ExecutivePresenceModeProps) {
  const [stage, setStage] = useState<Stage>(scriptData ? 'generating-answer' : (customPrompt ? 'recording' : 'prompt'));
  const [prompt, setPrompt] = useState<string>(customPrompt || '');
  const [completeAnswer, setCompleteAnswer] = useState<string>('');
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

  // Generate complete answer when scriptData is provided
  useEffect(() => {
    if (scriptData && stage === 'generating-answer') {
      generateCompleteAnswer();
    }
  }, [scriptData, stage]);

  const generateCompleteAnswer = async () => {
    if (!scriptData) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/communication/generate-complete-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_content: scriptData.script_content,
          script_type: scriptData.script_type,
          sections: scriptData.sections || [],
          key_points: scriptData.key_points || [],
          tips: scriptData.tips || [],
        }),
      });

      if (!response.ok) {
        if (response.status === 0 || response.status === 503) {
          throw new Error('Backend server is not available. Please make sure the backend server is running on port 8000.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate complete answer');
      }

      const data = await response.json();
      setCompleteAnswer(data.complete_answer);
      setPrompt(scriptData.script_content); // Set prompt for analysis
      setStage('reading');
    } catch (err: any) {
      console.error('Error generating complete answer:', err);
      setError(err.message || 'Failed to generate complete answer. Please try again.');
      setStage('prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, transcript: string, duration: number) => {
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

      // If reading script, use audio analysis endpoint
      if (scriptData && audioBlob.size > 0) {
        // Use audio-based analysis for script reading
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('prompt', prompt);
        formData.append('transcript', finalTranscript || '');
        formData.append('audio_duration', duration.toString());
        formData.append('is_reading_script', 'true');

        const analysisResponse = await fetch(`${API_BASE_URL}/api/communication/analyze-presence-audio`, {
          method: 'POST',
          body: formData,
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
        return;
      }

      // Validate we have a transcript for non-script reading
      if (!finalTranscript || finalTranscript.trim().length === 0) {
        throw new Error('No transcript available. Please ensure your microphone is working and try again.');
      }

      // Get presence analysis (transcript-based for own answers)
      const analysisResponse = await fetch(`${API_BASE_URL}/api/communication/analyze-presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          transcript: finalTranscript,
          audio_duration: duration, // Duration in seconds
          is_reading_script: !!scriptData, // True when reading AI-generated script
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

  if (stage === 'generating-answer') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Generating complete answer...</p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Creating a full script based on the structure and guidance</p>
        </div>
      </div>
    );
  }

  if (stage === 'reading') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Script Review</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Read This Complete Answer</h2>
          
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>📖 Instructions:</strong> Read through this complete answer. When ready, click "Start Recording" and read it aloud. The script will remain visible while you record.
            </p>
          </div>

          {/* Complete Answer - Scrollable */}
          <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 max-h-[400px] overflow-y-auto">
            <div className="text-base leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
              {completeAnswer}
            </div>
          </div>

          <button
            onClick={() => setStage('recording')}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
          >
            <span>Start Recording</span>
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
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
          <span>Back to Script Review</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Read the Answer Aloud</h2>
          
          {scriptData ? (
            <>
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>📖 Read this complete answer while recording:</strong>
                </p>
              </div>
              
              {/* Complete Answer - Visible while recording, scrollable */}
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 max-h-[300px] overflow-y-auto">
                <div className="text-base leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                  {completeAnswer}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
                <p className="text-slate-700 dark:text-slate-300">{prompt}</p>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Answer this prompt verbally. Focus on speaking clearly and confidently.
              </p>
            </>
          )}

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
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {scriptData 
              ? "Evaluating speech delivery: tone, pace, clarity, fillers, confidence, pronunciation, pauses, and emphasis"
              : "Evaluating fillers, qualifiers, confidence indicators, and content quality"}
          </p>
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {scriptData ? 'Speech Delivery Analysis' : 'Executive Presence Analysis'}
          </h2>
          
          {scriptData && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>📝 Note:</strong> You were reading an AI-generated script. This analysis focuses on your <strong>speech delivery only</strong> (tone, pace, clarity, fillers, confidence, pronunciation, pauses, emphasis). Content quality is not evaluated.
              </p>
            </div>
          )}

          {feedback && (
            <div className="space-y-6">
              {/* Overall Assessment */}
              {feedback.overall_assessment && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {scriptData ? 'Overall Delivery Assessment' : 'Overall Assessment'}
                  </h3>
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

              {/* Tone and Emotion - Only when reading script (from audio analysis) */}
              {scriptData && feedback.tone_and_emotion && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Tone and Emotion
                    {feedback.tone_and_emotion.score !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        (Score: {feedback.tone_and_emotion.score}/100)
                      </span>
                    )}
                  </h3>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{feedback.tone_and_emotion.assessment}</p>
                    {feedback.tone_and_emotion.strengths && feedback.tone_and_emotion.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.tone_and_emotion.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.tone_and_emotion.improvements && feedback.tone_and_emotion.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.tone_and_emotion.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pauses - Only when reading script (from audio analysis) */}
              {scriptData && feedback.pauses && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Pauses
                    {feedback.pauses.score !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        (Score: {feedback.pauses.score}/100)
                      </span>
                    )}
                  </h3>
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="mb-3 space-y-1">
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Total pauses:</strong> {feedback.pauses.total_pauses}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Average pause duration:</strong> {feedback.pauses.average_pause_duration}s
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Long pauses:</strong> {feedback.pauses.long_pauses}
                      </p>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{feedback.pauses.assessment}</p>
                    {feedback.pauses.strengths && feedback.pauses.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.pauses.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.pauses.improvements && feedback.pauses.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.pauses.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pace and Rhythm - Only when reading script (from audio analysis) */}
              {scriptData && feedback.pace_and_rhythm && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Pace and Rhythm
                    {feedback.pace_and_rhythm.score !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        (Score: {feedback.pace_and_rhythm.score}/100)
                      </span>
                    )}
                  </h3>
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{feedback.pace_and_rhythm.assessment}</p>
                    {feedback.pace_and_rhythm.strengths && feedback.pace_and_rhythm.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.pace_and_rhythm.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.pace_and_rhythm.improvements && feedback.pace_and_rhythm.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.pace_and_rhythm.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pronunciation and Clarity - Only when reading script (from audio analysis) */}
              {scriptData && feedback.pronunciation_and_clarity && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Pronunciation and Clarity
                    {feedback.pronunciation_and_clarity.score !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        (Score: {feedback.pronunciation_and_clarity.score}/100)
                      </span>
                    )}
                  </h3>
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{feedback.pronunciation_and_clarity.assessment}</p>
                    {feedback.pronunciation_and_clarity.strengths && feedback.pronunciation_and_clarity.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.pronunciation_and_clarity.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.pronunciation_and_clarity.improvements && feedback.pronunciation_and_clarity.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.pronunciation_and_clarity.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emphasis and Intonation - Only when reading script (from audio analysis) */}
              {scriptData && feedback.emphasis_and_intonation && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Emphasis and Intonation
                    {feedback.emphasis_and_intonation.score !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        (Score: {feedback.emphasis_and_intonation.score}/100)
                      </span>
                    )}
                  </h3>
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{feedback.emphasis_and_intonation.assessment}</p>
                    {feedback.emphasis_and_intonation.strengths && feedback.emphasis_and_intonation.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.emphasis_and_intonation.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.emphasis_and_intonation.improvements && feedback.emphasis_and_intonation.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.emphasis_and_intonation.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Quality - Only when reading script (from audio analysis) */}
              {scriptData && feedback.voice_quality && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Voice Quality
                    {feedback.voice_quality.score !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        (Score: {feedback.voice_quality.score}/100)
                      </span>
                    )}
                  </h3>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="mb-3 space-y-1">
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Volume score:</strong> {feedback.voice_quality.volume_score}/100
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Clarity score:</strong> {feedback.voice_quality.clarity_score}/100
                      </p>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{feedback.voice_quality.assessment}</p>
                    {feedback.voice_quality.strengths && feedback.voice_quality.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Strengths:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.voice_quality.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.voice_quality.improvements && feedback.voice_quality.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Improvements:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                          {feedback.voice_quality.improvements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Quality - Only when NOT reading script */}
              {!scriptData && feedback.content_quality && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Content Quality</h3>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Structure:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{feedback.content_quality.structure}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Completeness:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{feedback.content_quality.completeness}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Relevance:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{feedback.content_quality.relevance}</p>
                      </div>
                      {feedback.content_quality.improvements && feedback.content_quality.improvements.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Content Improvements:</p>
                          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                            {feedback.content_quality.improvements.map((improvement, index) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
