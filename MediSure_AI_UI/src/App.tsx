import React, { useState, useEffect, useCallback } from 'react';
import { FileText, MessageCircle, Upload } from 'lucide-react';
import FileUploader from './components/FileUploader';
import DocumentSelector from './components/DocumentSelector';
import ChatBox from './components/ChatBox';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { pdfApi } from './services/api'; // You can rename this API later
import { DocumentItem } from './types';

function App() {
  const [documentList, setDocumentList] = useState<DocumentItem[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentListError, setDocumentListError] = useState<string | null>(null);
  const { toasts, removeToast, error: showError } = useToast();

  // Fetch document list
  const fetchDocumentList = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentListError(null);
    try {
      const docs = await pdfApi.getPDFList(); // Replace with generic document API if needed
      setDocumentList(docs);
      if (selectedDocument && !docs.some(doc => doc.name === selectedDocument)) {
        setSelectedDocument(null);
      }
      return docs;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load documents';
      setDocumentListError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [selectedDocument, showError]);

  // Initial load
  useEffect(() => {
    fetchDocumentList();
  }, [fetchDocumentList]);

  // Handle selection
  const handleSelectDocument = (docName: string) => {
    setSelectedDocument(docName);
  };

  // Handle upload success
  const handleUploadSuccess = useCallback(async (uploadedFileName: string) => {
    try {
      await fetchDocumentList();
      setSelectedDocument(uploadedFileName);
    } catch (err) {
      console.error('Error after upload:', err);
    }
  }, [fetchDocumentList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediSure AI
                </h1>
                <p className="text-gray-600 mt-1">Upload documents and ask questions about their content</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${documentList.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{documentList.length} documents available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${selectedDocument ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">
                  {selectedDocument ? 'Document selected' : 'No document selected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Select */}
          <div className="lg:col-span-1 space-y-8">
            <FileUploader onUploadSuccess={handleUploadSuccess} />
            <DocumentSelector
              documentList={documentList}
              selectedDocument={selectedDocument}
              onSelectDocument={handleSelectDocument}
              loading={isLoadingDocuments}
              error={documentListError}
            />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <ChatBox selectedDocument={selectedDocument} />
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <span>How to Use</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">1. Upload Document</h3>
              <p className="text-gray-600">Drag and drop or click to upload your document (max 10MB)</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">2. Select Document</h3>
              <p className="text-gray-600">Choose from your uploaded documents in the dropdown menu</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">3. Ask Questions</h3>
              <p className="text-gray-600">Start a conversation about your document content with AI assistance</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white/50 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              © 2025 MediSure AI. Built with React, TypeScript, and Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
