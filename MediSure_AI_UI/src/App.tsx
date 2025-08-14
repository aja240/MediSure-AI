import React, { useState, useEffect, useCallback } from 'react';
import { FileText, MessageCircle, Upload } from 'lucide-react';
import FileUploader from './components/FileUploader';
import PDFSelector from './components/PDFSelector';
import ChatBox from './components/ChatBox';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { pdfApi } from './services/api';
import { PDFItem } from './types';

function App() {
  const [pdfList, setPdfList] = useState<PDFItem[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [isLoadingPDFs, setIsLoadingPDFs] = useState(false);
  const [pdfListError, setPdfListError] = useState<string | null>(null);
  const { toasts, removeToast, error: showError } = useToast();

  // Fetch PDF list
  const fetchPDFList = useCallback(async () => {
    setIsLoadingPDFs(true);
    setPdfListError(null);
    
    try {
      const pdfs = await pdfApi.getPDFList();
      setPdfList(pdfs);
      
      // If current selection is no longer available, reset it
      if (selectedPDF && !pdfs.some(pdf => pdf.name === selectedPDF)) {
        setSelectedPDF(null);
      }
      
      return pdfs; // Return the fetched PDFs for chaining
    } catch (err: any) {
      console.error('Failed to fetch PDF list:', err);
      const errorMessage = err.message || 'Failed to load PDF list';
      setPdfListError(errorMessage);
      showError(errorMessage);
      throw err; // Re-throw for error handling in calling code
    } finally {
      setIsLoadingPDFs(false);
    }
  }, [selectedPDF, showError]);

  // Initial load
  useEffect(() => {
    fetchPDFList();
  }, [fetchPDFList]);

  const handleUploadSuccess = useCallback(async (uploadedFileName: string) => {
    // Refresh PDF list and auto-select the uploaded PDF
    try {
      await fetchPDFList();
      // Auto-select the uploaded PDF after the list is refreshed
      setSelectedPDF(uploadedFileName);
    } catch (err) {
      console.error('Error after upload:', err);
    }
  }, [fetchPDFList]);

  const handleSelectPDF = (pdfName: string) => {
    setSelectedPDF(pdfName);
  };

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
                <p className="text-gray-600 mt-1">Upload PDFs and ask questions about their content</p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${pdfList.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{pdfList.length} PDFs available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${selectedPDF ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">
                  {selectedPDF ? 'PDF selected' : 'No PDF selected'}
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
            <PDFSelector
              pdfList={pdfList}
              selectedPDF={selectedPDF}
              onSelectPDF={handleSelectPDF}
              loading={isLoadingPDFs}
              error={pdfListError}
            />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <ChatBox selectedPDF={selectedPDF} />
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
              <h3 className="text-lg font-semibold text-gray-900">1. Upload PDF</h3>
              <p className="text-gray-600">Drag and drop or click to upload your PDF document (max 10MB)</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">2. Select PDF</h3>
              <p className="text-gray-600">Choose from your uploaded PDFs in the dropdown menu</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">3. Ask Questions</h3>
              <p className="text-gray-600">Start a conversation about your PDF content with AI assistance</p>
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