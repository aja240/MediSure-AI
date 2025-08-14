export interface PDFItem {
  name: string;
  id?: string;
  uploadDate?: string;
}

export interface DocumentItem {
  name: string;         // The file name (e.g., "report.pdf")
  type?: string;        // Optional: MIME type or extension (e.g., "pdf", "txt", "hl7", "csv")
  size?: number;        // Optional: File size in bytes
  uploadedAt?: string;  // Optional: ISO date string for upload time
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