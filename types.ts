export interface AudioConfig {
  sampleRate: number;
}

export interface TranscriptItem {
  id: string;
  text: string;
  sender: 'user' | 'model';
  timestamp: Date;
  isFinal: boolean;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface LiveSessionHooks {
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  connectionState: ConnectionState;
  transcripts: TranscriptItem[];
  volumeUser: number; // 0-1 for visualization
  volumeModel: number; // 0-1 for visualization
  error: string | null;
}