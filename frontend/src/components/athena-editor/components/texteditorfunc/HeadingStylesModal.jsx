import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X } from 'lucide-react';
import { GuardedOverlay } from './GuardedOverlay.jsx';

export const HeadingStylesModal = ({
  open,
  customStyles,
  onClose,
  onApplyHeadingStyle,
  onChangeStyle,
  onSaveAll
}) => {
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
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Heading Styles</h2>
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div key={level} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Heading {level}</h3>
                        <Button
                          onClick={() => onApplyHeadingStyle(level)}
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          Apply Style
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                          <Input
                            type="number"
                            defaultValue={24 + (7 - level) * 4}
                            onChange={(e) => {
                              onChangeStyle(level, { fontSize: `${e.target.value}px` });
                            }}
                            className="h-8"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight</label>
                          <select
                            defaultValue="bold"
                            onChange={(e) => {
                              onChangeStyle(level, { fontWeight: e.target.value });
                            }}
                            className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="600">Semi-Bold</option>
                            <option value="800">Extra Bold</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={onSaveAll}>
                  Save All Styles
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HeadingStylesModal;
