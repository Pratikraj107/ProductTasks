import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface CompressionFeedback {
  original: string;
  compressed_2min: string;
  compressed_60sec: string;
  removed_fluff: string[];
  structure_improvements: string[];
  decision_framing: string;
}

type Stage = 'question' | 'recording' | 'compressing' | 'feedback';

export default function AnswerCompressionMode({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('question');
  const [question, setQuestion] = useState<string>('');
  const [originalAnswer, setOriginalAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<CompressionFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pmQuestions = [
    "How would you prioritize features for a new product launch?",
    "Describe a time when you had to make a difficult product decision with limited data.",
    "How do you measure product success?",
    "Walk me through how you would build a product from zero to one.",
    "How do you handle conflicting stakeholder priorities?",
    "What's your approach to user research and validation?",
  ];

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * pmQuestions.length);
    setQuestion(pmQuestions[randomIndex]);
  };

  const handleRecordingComplete = async (audioBlob: Blob, transcript: string) => {
    setOriginalAnswer(transcript);
    setStage('compressing');
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

      // Get compression feedback
      const feedbackResponse = await fetch(`${API_BASE_URL}/api/communication/compress-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          answer: finalTranscript,
        }),
      });

      if (!feedbackResponse.ok) {
        if (feedbackResponse.status === 0 || feedbackResponse.status === 503) {
          throw new Error('Backend server is not available. Please make sure the backend server is running on port 8000, or check your VITE_API_BASE_URL environment variable.');
        }
        const errorData = await feedbackResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get compression feedback');
      }

      const feedbackData = await feedbackResponse.json();
      setFeedback(feedbackData);
      setStage('feedback');
    } catch (err: any) {
      console.error('Error processing answer:', err);
      const errorMessage = err.message || 'Failed to process your answer. Please try again.';
      setError(errorMessage);
      setStage('recording');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStage('recording');
    setOriginalAnswer('');
    setFeedback(null);
    setError(null);
  };

  const handleNewQuestion = () => {
    setStage('question');
    setQuestion('');
    setOriginalAnswer('');
    setFeedback(null);
    setError(null);
  };

  if (stage === 'question') {
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Answer Compression Mode</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You'll answer a PM interview question, then compress it to 2 minutes and 60 seconds. 
            AI will show you what fluff was removed and how structure improved.
          </p>

          {question ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Your Question:</p>
                <p className="text-slate-700 dark:text-slate-300">{question}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStage('recording')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
                >
                  Start Answering
                </button>
                <button
                  onClick={getRandomQuestion}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-medium"
                >
                  New Question
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={getRandomQuestion}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
            >
              Get Random Question
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Answer the Question</h2>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <p className="text-slate-700 dark:text-slate-300">{question}</p>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Answer this question verbally. Take your time — there's no time limit. 
            We'll compress it later.
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

  if (stage === 'compressing') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Compressing your answer...</p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Analyzing structure and removing fluff</p>
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Compression Analysis</h2>

          {feedback && (
            <div className="space-y-6">
              {/* Original Answer */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Original Answer</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300">{feedback.original}</p>
                </div>
              </div>

              {/* 2 Minute Version */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Compressed to 2 Minutes</h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-slate-700 dark:text-slate-300">{feedback.compressed_2min}</p>
                </div>
              </div>

              {/* 60 Second Version */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Compressed to 60 Seconds</h3>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-slate-700 dark:text-slate-300">{feedback.compressed_60sec}</p>
                </div>
              </div>

              {/* Removed Fluff */}
              {feedback.removed_fluff && feedback.removed_fluff.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Removed Fluff</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    {feedback.removed_fluff.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structure Improvements */}
              {feedback.structure_improvements && feedback.structure_improvements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Structure Improvements</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    {feedback.structure_improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decision Framing */}
              {feedback.decision_framing && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Decision Framing</h3>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-slate-700 dark:text-slate-300">{feedback.decision_framing}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={handleNewQuestion}
              className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-medium"
            >
              New Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
