import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { pdfApi } from '../services/api';
import { useToast } from '../hooks/useToast';

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      error('Only PDF files are allowed. Please select a valid PDF file.');
      return;
    }

    // Validate filename - no spaces or special characters
    const filename = file.name;
    const filenameWithoutExtension = filename.replace(/\.pdf$/i, '');
    const validFilenameRegex = /^[a-zA-Z0-9_-]+$/;
    
    if (!validFilenameRegex.test(filenameWithoutExtension)) {
      error('Filename can only contain letters, numbers, hyphens (-), and underscores (_). No spaces or special characters allowed.');
      return;
    }

    if (file.size > 30 * 1024 * 1024) { // 40MB limit
      error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const response = await pdfApi.uploadPDF(file);
      debugger
      if (response.success) {
        success(`Successfully uploaded ${file.name}`);
        onUploadSuccess(response.filename || file.name);
      } else {
        error(response.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      error(err.message || 'Failed to upload PDF');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Upload className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Upload PDF</h2>
          <p className="text-sm text-gray-600">Upload a PDF to start asking questions</p>
        </div>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-blue-600">Uploading...</p>
              <p className="text-sm text-gray-500">Please wait while we process your PDF</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <File className={`w-12 h-12 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">
                {dragActive ? 'Drop your PDF here' : 'Drag and drop a PDF file'}
              </p>
              <p className="text-sm text-gray-500">
                or <span className="text-blue-600 font-medium">click to browse</span>
              </p>
              <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Guidelines */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Upload Guidelines:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Only PDF files (.pdf) are accepted</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Filename must contain only letters, numbers, hyphens, and underscores</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Maximum file size is 10MB</span>
          </li>
          <li className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>No spaces or special characters in filename</span>
          </li>
          <li className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>Processing may take a few moments after upload</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;