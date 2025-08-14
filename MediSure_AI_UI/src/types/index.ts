export interface PDFItem {
  name: string;
  id?: string;
  uploadDate?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isExample?: boolean;
}

export interface UploadResponse {
  message: string;
  filename?: string;
  success: boolean;
}

export interface AskResponse {
  answer: string;
  success: boolean;
  error?: string;
}

export interface APIError {
  message: string;
  status?: number;
  code?: string;
}