import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, FileText } from 'lucide-react';

export const DocumentOutline = ({
  isOpen,
  onClose,
  headings,
  onHeadingClick,
  documentTitle,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-64 border-r border-border bg-background flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Outline</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Document Title */}
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-medium text-sm truncate">{documentTitle}</h2>
          </div>

          {/* Headings List */}
          <div className="flex-1 overflow-y-auto py-2">
            {headings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No headings found. Add headings to see the document outline.
                </p>
              </div>
            ) : (
              <nav className="space-y-0.5">
                {headings.map((heading, index) => (
                  <button
                    key={`${heading.id}-${index}`}
                    onClick={() => onHeadingClick(heading.id)}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 text-left text-sm hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground`}
                    style={{ paddingLeft: `${(heading.level - 1) * 12 + 16}px` }}
                  >
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{heading.text}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {headings.length} heading{headings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};