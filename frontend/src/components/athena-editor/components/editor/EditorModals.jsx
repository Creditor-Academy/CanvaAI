import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, Link } from 'lucide-react';
import { FindReplaceModal } from './FindReplaceModal';
import { ExportDialog } from '../ExportDialog';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

export const EditorModals = ({
  // Find & Replace
  showFindReplaceModal,
  findReplaceMode,
  updateUIState,
  editor,
  
  // Export
  showExportDialog,
  updateEditorFeatures,
  exportFormat,
  handleExport,
  isExportLoading,
  exportProgressPercent,
  exportStageMessage,
  documentTitle,
  documentStats,
  
  // Version History
  showVersionHistory,
  setShowVersionHistory,
  documentVersions,
  handleRestoreVersion,
  
  // Restore Confirm
  restoreTarget,
  setRestoreTarget,
  cancelRestore,
  confirmRestore,
  
  // Delete Confirm
  showDeleteConfirm,
  setShowDeleteConfirm,
  cancelDelete,
  confirmDelete,
  
  // Image Modal
  showImageModal,
  setShowImageModal,
  imageInsertMethod,
  setImageInsertMethod,
  handleImageUpload,
  isImageUploading,
  uploadProgress,
  imageUrl,
  setImageUrl,
  selectedImageAlt,
  setSelectedImageAlt,
  handleImageUrlSubmit,
  
  // Import Modal
  showImportModal,
  isImporting,
  isDragging,
  importError,
  importFileInputRef,
  handleImportFile
}) => {
  return (
    <>
      {/* Find & Replace */}
      <FindReplaceModal
        isOpen={showFindReplaceModal}
        onClose={() => updateUIState({ showFindReplaceModal: false })}
        editor={editor}
        isReplaceMode={findReplaceMode}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={(open) => updateEditorFeatures({ showExportDialog: open })}
        exportFormat={exportFormat}
        onFormatChange={(value) => updateEditorFeatures({ exportFormat: value })}
        onExport={handleExport}
        exportLoading={isExportLoading}
        exportProgress={exportProgressPercent}
        exportStage={exportStageMessage}
        documentTitle={documentTitle}
        documentStats={documentStats}
      />

      {/* Version History */}
      <AnimatePresence>
        {showVersionHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVersionHistory(false)} className="fixed inset-0 bg-black/20 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Version History</h2>
                  <button onClick={() => setShowVersionHistory(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                  {documentVersions.map((version) => (
                    <div key={version.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{version.title}</h3>
                        <p className="text-sm text-gray-500">{version.timestamp.toLocaleString()} · {version.author}</p>
                      </div>
                      <Button onClick={() => handleRestoreVersion(version.id)} size="sm">Restore</Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent className="max-w-md bg-white" aria-describedby="restore-dialog-description">
          <DialogHeader>
            <DialogTitle>Restore Previous Version?</DialogTitle>
            <DialogDescription id="restore-dialog-description">
              This will replace your current document with the version "{restoreTarget?.title}" from {restoreTarget?.timestamp?.toLocaleString()}.
              <br /><br />
              <strong>Your current content will be preserved in undo history</strong>, so you can revert back if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelRestore}>
              Cancel
            </Button>
            <Button onClick={confirmRestore} className="bg-blue-600 hover:bg-blue-700">
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <DialogContent className="max-w-md bg-white" aria-describedby="delete-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Document Permanently?</DialogTitle>
            <DialogDescription id="delete-dialog-description">
              This action cannot be undone. This will permanently delete the document "{documentTitle}" from MongoDB.
              <br /><br />
              <strong>All content will be lost forever.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowImageModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              style={{ zIndex: 400 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{ zIndex: 400 }}
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Add Image</h2>
                    <p className="text-xs text-slate-500">Upload, link, or search for visuals</p>
                  </div>
                  <button onClick={() => setShowImageModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {/* Navigation Tabs */}
                  <div className="flex p-0.5 bg-slate-100 rounded-lg mb-4 w-fit">
                    {['upload', 'url', 'stock'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setImageInsertMethod(method)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${imageInsertMethod === method ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Content Areas */}
                  <div className="space-y-4">
                    {imageInsertMethod === 'upload' && (
                      <div
                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/30 group cursor-pointer text-center"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            handleImageUpload(file);
                          } else {
                            // toast would be better here but it's a separate component
                          }
                        }}
                      >
                        <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP (max 5MB)</p>

                        {isImageUploading && (
                          <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Uploading...</span>
                              <span>{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ duration: 0.2 }}
                              />
                            </div>
                          </div>
                        )}

                        {!isImageUploading && (
                          <>
                            <input type="file" className="hidden" id="image-upload" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} />
                            <Button variant="outline" className="mt-3 h-8 text-xs" onClick={() => document.getElementById('image-upload').click()}>
                              Browse Files
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {imageInsertMethod === 'url' && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image URL</Label>
                          <div className="relative">
                            <Link className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                            <Input
                              className="pl-9 h-9 text-sm"
                              placeholder="Paste image link here..."
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                            />
                          </div>
                        </div>
                        {imageUrl && (
                          <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center relative group">
                            <img
                              src={imageUrl}
                              alt="Preview"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Alt text"
                        value={selectedImageAlt}
                        onChange={(e) => setSelectedImageAlt(e.target.value)}
                        className="bg-white h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="h-9" onClick={() => setShowImageModal(false)}>Cancel</Button>
                    <Button
                      disabled={!imageUrl && imageInsertMethod !== 'upload'}
                      onClick={handleImageUrlSubmit}
                      className="bg-blue-600 hover:bg-blue-700 h-9 px-6 text-sm"
                    >
                      Insert Image
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150]"
              onClick={() => updateUIState({ showImportModal: false })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="fixed inset-0 z-[160] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Import document</h2>
                    <p className="text-xs text-slate-400 mt-0.5">DOCX, PDF, Markdown, HTML, TXT, EPUB</p>
                  </div>
                  <button
                    onClick={() => updateUIState({ showImportModal: false })}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drop zone / Progress */}
                <div className="p-6">
                  {!isImporting && (
                    <div
                      onDragOver={e => { e.preventDefault(); updateUIState({ isDragging: true }); }}
                      onDragLeave={() => updateUIState({ isDragging: false })}
                      onDrop={(e) => {
                        e.preventDefault();
                        updateUIState({ isDragging: false });
                        handleImportFile(e.dataTransfer.files);
                      }}
                      onClick={() => importFileInputRef.current?.click()}
                      className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">Drop your file here</p>
                      <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                    </div>
                  )}

                  {isImporting && (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                      <p className="font-semibold text-slate-800">Processing file...</p>
                    </div>
                  )}

                  {importError && (
                    <div className="py-8 flex flex-col items-center justify-center text-center gap-4 text-red-600">
                      <AlertCircle className="w-12 h-12" />
                      <p className="font-semibold">{importError}</p>
                    </div>
                  )}

                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".docx,.pdf,.md,.markdown,.html,.htm,.txt,.epub,.json"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImportFile(e.target.files)}
                  />
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex justify-end">
                  <button
                    onClick={() => { updateUIState({ showImportModal: false, importError: null }); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
