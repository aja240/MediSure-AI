import React from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { PDFItem } from '../types';

interface PDFSelectorProps {
  pdfList: PDFItem[];
  selectedPDF: string | null;
  onSelectPDF: (pdfName: string) => void;
  loading: boolean;
  error: string | null;
}

const PDFSelector: React.FC<PDFSelectorProps> = ({
  pdfList,
  selectedPDF,
  onSelectPDF,
  loading,
  error
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-teal-100 rounded-lg">
          <FileText className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Select PDF</h2>
          <p className="text-sm text-gray-600">Choose a PDF to start asking questions</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          {error.includes('Unable to connect') && (
            <div className="mt-2 text-xs text-red-600">
              <p>To resolve this issue:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Ensure your FastAPI backend server is running</li>
                <li>Check that it's accessible at the configured URL</li>
                <li>Verify there are no firewall or network restrictions</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <select
          value={selectedPDF || ''}
          onChange={(e) => e.target.value && onSelectPDF(e.target.value)}
          disabled={loading || pdfList.length === 0}
          className={`
            w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            text-gray-900 font-medium transition-all duration-200
            ${loading || pdfList.length === 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-gray-400 cursor-pointer'
            }
          `}
        >
          <option value="">
            {loading 
              ? 'Loading PDFs...' 
              : pdfList.length === 0 
                ? 'No PDFs available - Upload one first' 
                : 'Select a PDF document'
            }
          </option>
          {pdfList.map((pdf) => (
            <option key={pdf.name} value={pdf.name}>
              {pdf.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {selectedPDF && (
        <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <p className="text-sm font-medium text-teal-800">Selected: {selectedPDF}</p>
          </div>
          <p className="text-xs text-teal-600 mt-1">Ready for questions!</p>
        </div>
      )}

      {pdfList.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Available PDFs ({pdfList.length}):</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pdfList.map((pdf) => (
              <div 
                key={pdf.name}
                className={`
                  text-sm p-2 rounded cursor-pointer transition-colors
                  ${selectedPDF === pdf.name 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                onClick={() => onSelectPDF(pdf.name)}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{pdf.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFSelector;