import axios, { AxiosResponse } from 'axios';
import { PDFItem, UploadResponse, AskResponse, APIError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    
    // Handle network errors specifically
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
      const apiError: APIError = {
        message: 'Unable to connect to the server. Please ensure the backend API is running on ' + API_BASE_URL,
        status: 0,
        code: error.code || 'NETWORK_ERROR',
      };
      return Promise.reject(apiError);
    }
    
    const apiError: APIError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      code: error.code,
    };
    
    return Promise.reject(apiError);
  }
);

export const pdfApi = {
  // Upload PDF file
  async uploadPDF(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<UploadResponse> = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Upload progress tracking
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Upload Progress: ${percentCompleted}%`);
        }
      },
    });
    
    return response.data;
  },

  // Get list of available PDFs
  async getPDFList(): Promise<PDFItem[]> {
    const response: AxiosResponse<PDFItem[]> = await apiClient.get('/pdflist');
    return response.data;
  },

  // Ask question about a PDF
  async askQuestion(pdfName: string, question: string): Promise<AskResponse> {
    const formData = new FormData();
    formData.append('pdf_name', pdfName);
    formData.append('question', question);
    
    const response: AxiosResponse<AskResponse> = await apiClient.post('/ask', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};

export default apiClient;