import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { GuardedOverlay } from './GuardedOverlay.jsx';

export const VersionHistoryModal = ({ open, versions, onClose, onRestore }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <GuardedOverlay onClose={onClose} className="fixed inset-0 bg-black/20 z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Version History</h2>
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{version.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {version.timestamp.toLocaleString()} • {version.author}
                          </p>
                        </div>
                        <Button onClick={() => onRestore(version.id)} size="sm" className="h-8">
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VersionHistoryModal;
