import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Pause, Play, RotateCcw, Check, Loader, MessageSquare, Volume2, Bot } from 'lucide-react';

interface MockInterviewModalProps {
  question: string;
  questionId?: number;
  questionIndex?: number;
  onClose: () => void;
  onInterviewComplete?: () => void; // Callback when interview is completed (for usage tracking)
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'transcribed' | 'feedback';
type InterviewMode = 'traditional' | 'ai_interviewer';

interface ConversationMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

interface AISessionState {
  question: string;
  conversation_history: ConversationMessage[];
  current_stage: string;
  follow_up_count: number;
  interview_complete: boolean;
}

interface FeedbackData {
  clarity: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  content: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  completeness: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  frameworks: {
    score: number;
    feedback: string;
    frameworks_used: string[];
    frameworks_recommended: string[];
    strengths: string[];
    improvements: string[];
  };
  overall: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function MockInterviewModal({ question, questionId, questionIndex, onClose, onInterviewComplete }: MockInterviewModalProps) {
  // Mode selection
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('ai_interviewer'); // Default to AI interviewer
  
  // Traditional mode state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  // AI Interviewer mode state
  const [aiSessionState, setAiSessionState] = useState<AISessionState | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [currentUserAnswer, setCurrentUserAnswer] = useState('');
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = transcript;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors during recording
          return;
        }
        setError(`Speech recognition error: ${event.error}`);
        stopRecording();
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setEditedTranscript('');
      setFeedback(null);
      setTimer(0);

      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setRecordingState('recording');
      startTimer();
    } catch (err: any) {
      setError(`Failed to start recording: ${err.message}`);
      console.error('Error starting recording:', err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopTimer();
    setRecordingState('paused');
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    startTimer();
    setRecordingState('recording');
  };

  const stopRecording = async () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop audio recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        // Process the recording
        setRecordingState('processing');
        
        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Send to backend for transcription (as backup/verification)
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const transcribeResponse = await fetch(`${API_BASE_URL}/api/interview/transcribe`, {
            method: 'POST',
            body: formData,
          });

          if (!transcribeResponse.ok) {
            throw new Error('Failed to transcribe audio');
          }

          const transcribeData = await transcribeResponse.json();
          
          // Use backend transcription if available, otherwise use real-time transcript
          const finalTranscript = transcribeData.transcript || transcript;
          setTranscript(finalTranscript);
          setEditedTranscript(finalTranscript);
          setRecordingState('transcribed');
        } catch (err: any) {
          console.error('Error processing recording:', err);
          // If backend transcription fails, use real-time transcript
          setEditedTranscript(transcript);
          setRecordingState('transcribed');
        }
      };
    }

    stopTimer();
  };

  const getFeedback = async () => {
    if (!editedTranscript.trim()) {
      setError('Please provide a transcript before getting feedback');
      return;
    }

    setRecordingState('processing');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          answer: editedTranscript,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback');
      }

      const feedbackData = await response.json();
      setFeedback(feedbackData);
      setRecordingState('feedback');
      
      // Increment usage count after successful feedback
      if (onInterviewComplete) {
        onInterviewComplete();
      }
    } catch (err: any) {
      setError(`Failed to get feedback: ${err.message}`);
      setRecordingState('transcribed');
      console.error('Error getting feedback:', err);
    }
  };

  const handleReRecord = () => {
    setTranscript('');
    setEditedTranscript('');
    setFeedback(null);
    setTimer(0);
    setError(null);
    setRecordingState('idle');
    setGeneratedAnswer(null);
    audioChunksRef.current = [];
  };

  // AI Interviewer Functions
  const startAIInterview = async () => {
    try {
      setError(null);
      setIsProcessingAnswer(true);
      setConversationHistory([]);
      setCurrentUserAnswer('');

      const response = await fetch(`${API_BASE_URL}/api/interview/ai/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to start AI interview');
      }

      const data = await response.json();
      
      // Update session state
      setAiSessionState({
        question: data.question,
        conversation_history: [],
        current_stage: data.current_stage,
        follow_up_count: 0,
        interview_complete: false
      });

      // Add interviewer message to conversation
      const interviewerMsg: ConversationMessage = {
        role: 'interviewer',
        content: data.interviewer_response,
        timestamp: new Date()
      };
      setConversationHistory([interviewerMsg]);

      // Play audio if available
      if (data.audio_base64) {
        console.log('Audio received, length:', data.audio_base64.length);
        try {
          await playAudioFromBase64(data.audio_base64);
        } catch (audioErr) {
          console.error('Error playing audio:', audioErr);
          // Don't fail the whole interview if audio fails
        }
      } else {
        console.warn('No audio_base64 in response');
      }

      setIsProcessingAnswer(false);
    } catch (err: any) {
      setError(`Failed to start AI interview: ${err.message}`);
      setIsProcessingAnswer(false);
      console.error('Error starting AI interview:', err);
    }
  };

  const playAudioFromBase64 = async (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        setIsAiSpeaking(true);
        console.log('Attempting to play audio, base64 length:', base64Audio.length);
        
        // ElevenLabs returns MP3, so try that first
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        
        // Set volume
        audio.volume = 1.0;
        
        audio.oncanplaythrough = () => {
          console.log('Audio can play through');
          audio.play().then(() => {
            console.log('Audio playing successfully');
          }).catch((err) => {
            console.error('Error playing audio:', err);
            setIsAiSpeaking(false);
            reject(err);
          });
        };
        
        audio.onloadeddata = () => {
          console.log('Audio data loaded');
        };
        
        audio.onended = () => {
          console.log('Audio playback ended');
          setIsAiSpeaking(false);
          resolve();
        };
        
        audio.onerror = (e) => {
          console.error('Audio error:', e, audio.error);
          setIsAiSpeaking(false);
          // Try alternative format
          const audioUrl2 = `data:audio/mp3;base64,${base64Audio}`;
          const audio2 = new Audio(audioUrl2);
          audio2.volume = 1.0;
          audio2.oncanplaythrough = () => {
            audio2.play().then(() => {
              console.log('Audio playing with alternative format');
              audioPlayerRef.current = audio2;
            }).catch((err) => {
              console.error('Alternative format also failed:', err);
              reject(new Error('Failed to play audio'));
            });
          };
          audio2.onended = () => {
            setIsAiSpeaking(false);
            resolve();
          };
          audio2.onerror = () => {
            setIsAiSpeaking(false);
            reject(new Error('Failed to play audio in any format'));
          };
        };
        
        // Load the audio
        audio.load();
      } catch (err) {
        setIsAiSpeaking(false);
        console.error('Error setting up audio:', err);
        reject(err);
      }
    });
  };

  const processUserAnswer = async (userAnswer: string) => {
    if (!aiSessionState || !userAnswer.trim()) {
      return;
    }

    try {
      setIsProcessingAnswer(true);
      setError(null);

      // Add user answer to conversation
      const userMsg: ConversationMessage = {
        role: 'candidate',
        content: userAnswer,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, userMsg]);

      const response = await fetch(`${API_BASE_URL}/api/interview/ai/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_state: aiSessionState,
          user_answer: userAnswer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process answer');
      }

      const data = await response.json();

      // Update session state
      setAiSessionState({
        question: data.session_state.question,
        conversation_history: [],
        current_stage: data.session_state.current_stage,
        follow_up_count: data.session_state.follow_up_count,
        interview_complete: data.session_state.interview_complete
      });

      // Add interviewer response to conversation
      if (data.interviewer_response) {
        const interviewerMsg: ConversationMessage = {
          role: 'interviewer',
          content: data.interviewer_response,
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, interviewerMsg]);

        // Play audio if available
        if (data.audio_base64) {
          await playAudioFromBase64(data.audio_base64);
        }
      }

      // Clear current answer
      setCurrentUserAnswer('');

      // If interview is complete, get feedback
      if (data.interview_complete) {
        await getFinalFeedback();
      }

      setIsProcessingAnswer(false);
    } catch (err: any) {
      setError(`Failed to process answer: ${err.message}`);
      setIsProcessingAnswer(false);
      console.error('Error processing answer:', err);
    }
  };

  const getFinalFeedback = async () => {
    // Collect all user answers from conversation
    const userAnswers = conversationHistory
      .filter(msg => msg.role === 'candidate')
      .map(msg => msg.content)
      .join(' ');

    if (!userAnswers.trim()) {
      setError('No answer provided for feedback');
      return;
    }

    setIsProcessingAnswer(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          answer: userAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback');
      }

      const feedbackData = await response.json();
      setFeedback(feedbackData);
      
      // Switch to feedback view (we'll handle this in the UI)
      if (onInterviewComplete) {
        onInterviewComplete();
      }
    } catch (err: any) {
      setError(`Failed to get feedback: ${err.message}`);
      console.error('Error getting feedback:', err);
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  const handleAIStopRecording = async () => {
    // Stop recording and process answer
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    stopTimer();

    // Wait for transcription
    setRecordingState('processing');
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const transcribeResponse = await fetch(`${API_BASE_URL}/api/interview/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (transcribeResponse.ok) {
        const transcribeData = await transcribeResponse.json();
        const finalTranscript = transcribeData.transcript || transcript;
        
        // Process the answer
        await processUserAnswer(finalTranscript);
      } else {
        // Use real-time transcript
        await processUserAnswer(transcript);
      }
      
      setRecordingState('idle');
      setTranscript('');
      audioChunksRef.current = [];
    } catch (err: any) {
      setError(`Failed to process recording: ${err.message}`);
      setRecordingState('idle');
    }
  };

  const generateAnswer = async () => {
    if (!questionId || questionIndex === undefined) {
      setError('Question ID and index are required to generate answer');
      return;
    }

    setIsGeneratingAnswer(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/answers/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          question_id: questionId,
          question_index: questionIndex,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate answer');
      }

      const data = await response.json();
      setGeneratedAnswer(data.answer);
    } catch (err: any) {
      setError(`Failed to generate answer: ${err.message}`);
      console.error('Error generating answer:', err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                  <Mic className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Mock Interview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Practice your answer and get AI feedback</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Mode Toggle */}
              <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setInterviewMode('ai_interviewer')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center space-x-2 ${
                    interviewMode === 'ai_interviewer'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Interviewer</span>
                </button>
                <button
                  onClick={() => setInterviewMode('traditional')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    interviewMode === 'traditional'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Traditional
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* AI Interviewer Mode */}
          {interviewMode === 'ai_interviewer' && (
            <>
              {/* Conversation History */}
              <div className="mb-6 space-y-4 max-h-[400px] overflow-y-auto">
                {conversationHistory.length === 0 && !isProcessingAnswer && (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-cyan-400 opacity-50" />
                    <p className="text-slate-400 text-lg">Ready to start your AI interview</p>
                    <button
                      onClick={startAIInterview}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all"
                    >
                      Start Interview
                    </button>
                  </div>
                )}

                {conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === 'interviewer'
                          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                          : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {msg.role === 'interviewer' ? (
                          <Bot className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-xs font-semibold text-slate-300">
                          {msg.role === 'interviewer' ? 'AI Interviewer' : 'You'}
                        </span>
                      </div>
                      <p className="text-white leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isProcessingAnswer && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <Loader className="w-5 h-5 animate-spin text-cyan-400" />
                    </div>
                  </div>
                )}

                {isAiSpeaking && (
                  <div className="flex justify-start">
                    <div className="bg-blue-500/20 rounded-2xl p-4 border border-blue-500/30 flex items-center space-x-2">
                      <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <span className="text-slate-300 text-sm">AI is speaking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recording Controls for AI Mode */}
              {aiSessionState && !aiSessionState.interview_complete && (
                <div className="space-y-4">
                  {recordingState === 'idle' && !isProcessingAnswer && !isAiSpeaking && (
                    <div className="flex flex-col items-center space-y-4">
                      <button
                        onClick={startRecording}
                        className="group relative"
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-700 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                        <div className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg transition-all shadow-xl">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                          <Mic className="w-6 h-6" />
                          <span>Record Your Answer</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={requestClarification}
                        disabled={isProcessingAnswer}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Ask for Clarification</span>
                      </button>
                    </div>
                  )}

                  {(recordingState === 'recording' || recordingState === 'paused') && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {recordingState === 'recording' && (
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-400 font-semibold">Recording...</span>
                            </div>
                          )}
                          {recordingState === 'paused' && (
                            <span className="text-yellow-400 font-semibold">Paused</span>
                          )}
                        </div>
                        <div className="text-2xl font-mono text-cyan-400">{formatTime(timer)}</div>
                      </div>
                      
                      <div className="mb-4 bg-slate-900/50 rounded-lg p-4 min-h-[100px]">
                        <p className="text-slate-200 whitespace-pre-wrap">{transcript || 'Your speech will appear here...'}</p>
                      </div>

                      <div className="flex items-center justify-center space-x-3">
                        {recordingState === 'recording' && (
                          <button
                            onClick={pauseRecording}
                            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all"
                          >
                            <Pause className="w-5 h-5 inline mr-2" />
                            Pause
                          </button>
                        )}
                        {recordingState === 'paused' && (
                          <>
                            <button
                              onClick={resumeRecording}
                              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                            >
                              <Play className="w-5 h-5 inline mr-2" />
                              Resume
                            </button>
                            <button
                              onClick={handleAIStopRecording}
                              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                            >
                              <MicOff className="w-5 h-5 inline mr-2" />
                              Stop & Submit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {recordingState === 'processing' && (
                    <div className="text-center py-8">
                      <Loader className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
                      <p className="text-slate-400">Processing your answer...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </>
          )}

          {/* Traditional Mode */}
          {interviewMode === 'traditional' && (
            <>
              {/* Question Card - Enhanced */}
              <div className="mb-8">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/20">
                    <div className="flex items-center space-x-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Interview Question</h3>
                    </div>
                    <p className="text-white text-xl leading-relaxed font-medium">{question}</p>
                  </div>
                </div>
              </div>

              {/* Timer and Transcript - Side by Side Layout */}
              {recordingState !== 'feedback' && (
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Timer and Controls */}
                <div className="flex flex-col items-center justify-center">
                  {/* Timer Display */}
                  <div className="relative mb-6 w-full max-w-xs">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-full border-2 border-slate-700 shadow-2xl">
                      <div className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 font-mono tracking-tight text-center">
                        {formatTime(timer)}
                      </div>
                    </div>
                  </div>

                  {/* Recording Status Indicator */}
                  {recordingState === 'recording' && (
                    <div className="flex flex-col items-center space-y-3 mb-6 w-full">
                      <div className="flex items-center space-x-3 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-sm">
                        <div className="relative">
                          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                          <div className="relative w-4 h-4 bg-red-500 rounded-full"></div>
                        </div>
                        <span className="text-red-400 font-bold text-sm uppercase tracking-wider">Recording</span>
                      </div>
                      {/* Audio Waveform Animation */}
                      <div className="flex items-center justify-center space-x-1 h-8">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-red-500 to-red-400 rounded-full animate-pulse"
                            style={{
                              height: `${20 + Math.random() * 30}px`,
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: `${0.5 + Math.random() * 0.3}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recordingState === 'paused' && (
                    <div className="flex items-center space-x-3 px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-full backdrop-blur-sm mb-6">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Paused</span>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex flex-col items-center space-y-3 w-full">
                    {recordingState === 'idle' && (
                      <button
                        onClick={startRecording}
                        className="group relative w-full max-w-sm"
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-700 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                        <div className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg transition-all shadow-xl">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                          <Mic className="w-6 h-6" />
                          <span>Start Recording</span>
                        </div>
                      </button>
                    )}

                    {recordingState === 'recording' && (
                      <button
                        onClick={pauseRecording}
                        className="group relative w-full max-w-sm"
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold text-lg transition-all shadow-xl">
                          <Pause className="w-6 h-6" />
                          <span>Pause</span>
                        </div>
                      </button>
                    )}

                    {recordingState === 'paused' && (
                      <div className="flex flex-col space-y-3 w-full max-w-sm">
                        <button
                          onClick={resumeRecording}
                          className="group relative"
                        >
                          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-green-700 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg transition-all shadow-xl">
                            <Play className="w-6 h-6" />
                            <span>Resume</span>
                          </div>
                        </button>
                        <button
                          onClick={stopRecording}
                          className="group relative"
                        >
                          <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold text-lg transition-all shadow-xl">
                            <MicOff className="w-6 h-6" />
                            <span>Stop</span>
                          </div>
                        </button>
                      </div>
                    )}

                    {recordingState === 'processing' && (
                      <div className="flex items-center justify-center space-x-3 px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-full w-full max-w-sm">
                        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
                        <span className="text-slate-300 font-semibold">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Live Transcript */}
                <div className="flex flex-col h-full">
                  {(recordingState === 'recording' || recordingState === 'paused') && (
                    <div className="relative group h-full flex flex-col">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 flex flex-col h-full">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          <h3 className="text-lg font-bold text-white">Live Transcript</h3>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-6 flex-1 overflow-y-auto border border-slate-700/30 custom-scrollbar min-h-[300px]">
                          {transcript ? (
                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-base">{transcript}</p>
                          ) : (
                            <p className="text-slate-500 italic text-center py-8">Your speech will appear here as you speak...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {recordingState === 'transcribed' && (
                    <div className="relative group h-full flex flex-col">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <h3 className="text-lg font-bold text-white">Your Answer Transcript</h3>
                          </div>
                          <button
                            onClick={handleReRecord}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white text-sm font-semibold transition-all border border-slate-600/50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Re-record</span>
                          </button>
                        </div>
                        <textarea
                          value={editedTranscript}
                          onChange={(e) => setEditedTranscript(e.target.value)}
                          placeholder="Your transcript will appear here..."
                          className="w-full flex-1 min-h-[300px] px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none transition-all custom-scrollbar"
                        />
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={getFeedback}
                            disabled={!editedTranscript.trim()}
                            className="group relative"
                          >
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity disabled:opacity-30"></div>
                            <div className="relative flex items-center space-x-2 px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold transition-all disabled:cursor-not-allowed shadow-xl">
                              <Check className="w-5 h-5" />
                              <span>Get Feedback</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(recordingState === 'idle' || recordingState === 'processing') && (
                    <div className="relative group h-full flex flex-col">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl blur opacity-10"></div>
                      <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 flex flex-col h-full items-center justify-center min-h-[300px]">
                        <div className="text-center text-slate-500">
                          <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-semibold">Transcript will appear here</p>
                          <p className="text-sm mt-2">Start recording to see your speech transcribed in real-time</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* Error Message (Traditional Mode) */}
          {interviewMode === 'traditional' && error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Feedback Section (Shared for both modes) */}
          {((interviewMode === 'traditional' && recordingState === 'feedback') || 
            (interviewMode === 'ai_interviewer' && feedback)) && feedback && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">AI Feedback</h3>
                <div className="flex items-center space-x-3">
                  {questionId && questionIndex !== undefined && (
                    <button
                      onClick={generateAnswer}
                      disabled={isGeneratingAnswer}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAnswer ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>Generate Answer</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleReRecord}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>

              {/* Overall Score */}
              <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white">Overall Score</h4>
                  <div className="text-4xl font-bold text-purple-400">
                    {feedback.overall.score}/10
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">{feedback.overall.summary}</p>
              </div>

              {/* Detailed Feedback Sections */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Clarity */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">Clarity</h4>
                    <span className="text-2xl font-bold text-blue-400">{feedback.clarity.score}/10</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{feedback.clarity.feedback}</p>
                  {feedback.clarity.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-green-400 text-xs font-semibold mb-1">Strengths:</p>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                        {feedback.clarity.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.clarity.improvements.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-xs font-semibold mb-1">Improvements:</p>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                        {feedback.clarity.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">Content</h4>
                    <span className="text-2xl font-bold text-green-400">{feedback.content.score}/10</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{feedback.content.feedback}</p>
                  {feedback.content.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-green-400 text-xs font-semibold mb-1">Strengths:</p>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                        {feedback.content.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.content.improvements.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-xs font-semibold mb-1">Improvements:</p>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                        {feedback.content.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Completeness */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">Completeness</h4>
                    <span className="text-2xl font-bold text-orange-400">{feedback.completeness.score}/10</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{feedback.completeness.feedback}</p>
                  {feedback.completeness.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-green-400 text-xs font-semibold mb-1">Strengths:</p>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                        {feedback.completeness.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.completeness.improvements.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-xs font-semibold mb-1">Improvements:</p>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                        {feedback.completeness.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Frameworks */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">PM Frameworks</h4>
                    <span className="text-2xl font-bold text-cyan-400">{feedback.frameworks.score}/10</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{feedback.frameworks.feedback}</p>
                  {feedback.frameworks.frameworks_used.length > 0 && (
                    <div className="mb-3">
                      <p className="text-cyan-400 text-xs font-semibold mb-1">Frameworks Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {feedback.frameworks.frameworks_used.map((f, i) => (
                          <span key={i} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {feedback.frameworks.frameworks_recommended.length > 0 && (
                    <div className="mb-3">
                      <p className="text-purple-400 text-xs font-semibold mb-1">Recommended:</p>
                      <div className="flex flex-wrap gap-2">
                        {feedback.frameworks.frameworks_recommended.map((f, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Recommendations */}
              {feedback.overall.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
                  <h4 className="text-lg font-bold text-white mb-3">Key Recommendations</h4>
                  <ul className="space-y-2">
                    {feedback.overall.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <span className="text-cyan-400 mt-1">•</span>
                        <span className="text-slate-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated Answer Section */}
              {generatedAnswer && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-white">Ideal Answer</h4>
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{generatedAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
