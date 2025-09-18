import React from 'react';
import type { Attachment } from '../../types';
import { DocumentMagnifyingGlassIcon } from '../icons/Icons';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, attachment }) => {
  if (!isOpen) {
    return null;
  }

  const renderPreview = () => {
    if (attachment.fileType.startsWith('image/')) {
      return <img src={attachment.fileContent} alt={attachment.fileName} className="max-w-full max-h-[75vh] mx-auto" />;
    }
    if (attachment.fileType === 'application/pdf') {
      return <iframe src={attachment.fileContent} title={attachment.fileName} className="w-full h-[80vh]" />;
    }
    return <p className="text-center text-gray-600">Preview not available for this file type.</p>;
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <DocumentMagnifyingGlassIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 truncate" id="modal-title">
                Preview: {attachment.fileName}
              </h3>
              <div className="mt-4 border rounded-lg p-2 bg-gray-100">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
