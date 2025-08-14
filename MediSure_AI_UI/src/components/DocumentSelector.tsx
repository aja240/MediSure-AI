import React, { useMemo } from 'react';
import { FileText, File, ChevronDown } from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentSelectorProps {
  documentList: DocumentItem[];
  selectedDocument: string | null;
  onSelectDocument: (docName: string) => void;
  loading: boolean;
  error: string | null;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documentList,
  selectedDocument,
  onSelectDocument,
  loading,
  error,
}) => {

  const getFileTypeIcon = useMemo(() => {
    return (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf':
          return <FileText className="w-3 h-3 text-teal-600" />;
        case 'csv':
          return <FileText className="w-3 h-3 text-teal-600" />;
        case 'hl7':
          return <File className="w-3 h-3 text-teal-600" />; // Generic icon for HL7
        case 'txt':
          return <FileText className="w-3 h-3 text-teal-600" />;
        default:
          return <File className="w-3 h-3 text-teal-600" />;
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-teal-100 rounded-lg">
          <FileText className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Select Document</h2>
          <p className="text-sm text-gray-600">
            Choose a document (.pdf, .txt, .hl7, .csv, .json) to start asking questions
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          {error.includes('Unable to connect') && (
            <div className="mt-2 text-xs text-red-600">
              <p>To resolve:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Ensure backend server is running</li>
                <li>Check accessibility at the configured URL</li>
                <li>Verify no firewall or network restrictions</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Select Dropdown */}
      <div className="relative">
        <select
          aria-label="Select Document"
          value={selectedDocument || ''}
          onChange={(e) => e.target.value && onSelectDocument(e.target.value)}
          disabled={loading || documentList.length === 0}
          className={`
            w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            text-gray-900 font-medium transition-all duration-200
            ${loading || documentList.length === 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-gray-400 cursor-pointer'
            }
          `}
        >
          <option value="">
            {loading
              ? 'Loading documents...'
              : documentList.length === 0
              ? 'No documents available - Upload one first'
              : 'Select a document'}
          </option>
          {documentList.map((doc) => (
            <option key={doc.name} value={doc.name}>
              {doc.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {/* Selected Document Preview */}
      {selectedDocument && (
        <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center space-x-2">
            {getFileTypeIcon(selectedDocument)}
            <p className="text-sm font-medium text-teal-800">Selected: {selectedDocument}</p>
          </div>
          <p className="text-xs text-teal-600 mt-1">Ready for questions!</p>
        </div>
      )}

      {/* Available Documents List */}
      {documentList.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Available Documents ({documentList.length}):
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {documentList.map((doc) => (
              <button
                key={doc.name}
                type="button"
                className={`
                  w-full text-left text-sm p-2 rounded transition-colors
                  ${selectedDocument === doc.name
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                onClick={() => onSelectDocument(doc.name)}
              >
                <div className="flex items-center space-x-2">
                  {getFileTypeIcon(doc.name)}
                  <span className="truncate">{doc.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;
