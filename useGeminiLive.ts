import { useState, useRef, useCallback, useEffect, startTransition } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, TranscriptItem, LiveSessionHooks } from '../types';
import { decodeBase64, decodeAudioData, convertFloat32ToPCM16 } from '../utils/audioUtils';

// Global declaration for webkitAudioContext to fix TS errors
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const API_KEY = process.env.API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

const SYSTEM_INSTRUCTION = `You are a simultaneous interpreter for Polish and English. Your goal is extreme fluency. 
If the user speaks Polish, output English audio immediately. 
If the user speaks English, output Polish audio immediately. 
Match the speaker's emotion, speed, and tone. 
Use idiomatic, native phrasing (Mother Tongue level). 
Do not apologize or explain; just translate.
Maintain a continuous flow.`;

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

export const useGeminiLive = (): LiveSessionHooks => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [volumeUser, setVolumeUser] = useState(0);
  const [volumeModel, setVolumeModel] = useState(0);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Optimization: store active session in ref to avoid promise resolution in audio loop
  const activeSessionRef = useRef<any>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Debounce timer for volume updates
  const volumeDebounceRef = useRef<number>(0);

  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const isRecordingRef = useRef<boolean>(false);

  const cleanupAudio = useCallback(() => {
    activeSessionRef.current = null;

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current.port.postMessage({ type: 'setRecording', value: false });
      workletNodeRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    activeSourcesRef.current.forEach(source => source.stop());
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (volumeDebounceRef.current) {
      cancelAnimationFrame(volumeDebounceRef.current);
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanupAudio();
    setConnectionState(ConnectionState.DISCONNECTED);
    isRecordingRef.current = false;
  }, [cleanupAudio]);

  const connect = useCallback(async () => {
    if (!API_KEY) {
      setError("API Key not found");
      return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      // Initialize Audio Contexts with Resume logic for browser autoplay policies
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      inputContextRef.current = inputCtx;

      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      outputContextRef.current = outputCtx;

      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: API_KEY });

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          inputAudioTranscription: { model: MODEL_NAME },
          outputAudioTranscription: { model: MODEL_NAME }
        },
        callbacks: {
          onopen: async () => {
            setConnectionState(ConnectionState.CONNECTED);

            if (!inputContextRef.current || !streamRef.current) return;

            try {
              // Load AudioWorklet module for low-latency processing
              await inputContextRef.current.audioWorklet.addModule('/audio-processor.js');

              const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
              inputSourceRef.current = source;

              // Create AudioWorklet node (replaces deprecated ScriptProcessorNode)
              const workletNode = new AudioWorkletNode(inputContextRef.current, 'audio-capture-processor');
              workletNodeRef.current = workletNode;

              // Handle messages from the worklet
              workletNode.port.onmessage = (event) => {
                if (event.data.type === 'volume') {
                  // Debounce volume updates to reduce re-renders
                  if (volumeDebounceRef.current) {
                    cancelAnimationFrame(volumeDebounceRef.current);
                  }
                  volumeDebounceRef.current = requestAnimationFrame(() => {
                    const rms = event.data.value;
                    startTransition(() => {
                      setVolumeUser(prev => prev * 0.8 + rms * 0.2);
                    });
                  });
                } else if (event.data.type === 'audio') {
                  if (!activeSessionRef.current) return;

                  const inputData = event.data.data;
                  const actualSampleRate = inputContextRef.current?.sampleRate || 16000;
                  const pcmData = convertFloat32ToPCM16(inputData, actualSampleRate);

                  // Send directly using cached session ref for performance
                  activeSessionRef.current.sendRealtimeInput({
                    media: {
                      mimeType: pcmData.mimeType,
                      data: pcmData.data
                    }
                  });
                }
              };

              source.connect(workletNode);
              workletNode.connect(inputContextRef.current.destination);
            } catch (err) {
              console.error('AudioWorklet initialization failed:', err);
              setError('Failed to initialize audio processor');
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent } = msg;

            // Handle Audio Output
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              const audioData = serverContent.modelTurn.parts[0].inlineData.data;
              if (audioData && outputContextRef.current) {
                const ctx = outputContextRef.current;
                try {
                  const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);

                  // Drift compensation: prevent drift by resetting cursor if it lags behind
                  const currentTime = ctx.currentTime;
                  // If next start time is in the past, reset it to now + small buffer
                  if (nextStartTimeRef.current < currentTime) {
                    nextStartTimeRef.current = currentTime + 0.05;
                  }

                  const source = ctx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(ctx.destination);

                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;

                  activeSourcesRef.current.add(source);
                  source.onended = () => activeSourcesRef.current.delete(source);

                  // Volume visualization - use startTransition for non-urgent updates
                  startTransition(() => {
                    setVolumeModel(0.4);
                  });
                  setTimeout(() => {
                    startTransition(() => {
                      setVolumeModel(0);
                    });
                  }, buffer.duration * 1000);
                } catch (decodeErr) {
                  console.error("Audio decode error", decodeErr);
                }
              }
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              if (outputContextRef.current) {
                nextStartTimeRef.current = outputContextRef.current.currentTime;
              }
            }

            // Handle Transcripts - batch updates for better performance
            const inTx = serverContent?.inputTranscription;
            if (inTx) {
              startTransition(() => {
                setTranscripts(prev => {
                  const newItem: TranscriptItem = {
                    id: generateId(),
                    text: inTx.text,
                    sender: 'user',
                    timestamp: new Date(),
                    isFinal: !!serverContent.turnComplete
                  };
                  if (inTx.text.trim()) return [...prev.slice(-50), newItem];
                  return prev;
                });
              });
            }

            const outTx = serverContent?.outputTranscription;
            if (outTx) {
              startTransition(() => {
                setTranscripts(prev => {
                  const newItem: TranscriptItem = {
                    id: generateId(),
                    text: outTx.text,
                    sender: 'model',
                    timestamp: new Date(),
                    isFinal: !!serverContent.turnComplete
                  };
                  if (outTx.text.trim()) return [...prev.slice(-50), newItem];
                  return prev;
                });
              });
            }
          },
          onclose: () => {
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection error");
            setConnectionState(ConnectionState.ERROR);
          }
        }
      });

      // Store session in ref once resolved
      sessionPromise.then(session => {
        activeSessionRef.current = session;
      });

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to connect");
      setConnectionState(ConnectionState.ERROR);
      cleanupAudio();
    }
  }, [cleanupAudio]);

  const startRecording = useCallback(() => {
    isRecordingRef.current = true;
    // Notify worklet to start capturing audio
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'setRecording', value: true });
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    // Notify worklet to stop capturing audio
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'setRecording', value: false });
    }
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    connectionState,
    transcripts,
    volumeUser,
    volumeModel,
    error
  };
};