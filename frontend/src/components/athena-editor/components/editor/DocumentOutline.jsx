import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronRight, FileText, Search, Hash, AlignLeft } from 'lucide-react';

// ── Design tokens — light blue theme ────────────────────────────────────────
const T = {
  bg:             'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
  border:         '#bfdbfe',
  borderSubtle:   '#dbeafe',
  headerBg:       'rgba(219,234,254,0.6)',
  inputBg:        'rgba(255,255,255,0.7)',
  inputBorder:    '#bfdbfe',
  inputFocus:     '#3b82f6',
  titleBg:        'rgba(255,255,255,0.55)',

  textPrimary:    '#1e3a5f',
  textSecondary:  '#1d4ed8',
  textMuted:      '#3b82f6',
  textFaint:      '#60a5fa',
  textPlaceholder:'#93c5fd',

  activeBar:      '#2563eb',
  activeBg:       'rgba(37,99,235,0.10)',
  hoverBg:        'rgba(147,197,253,0.25)',

  iconAccent:     '#2563eb',
  badgeBg:        'rgba(219,234,254,0.8)',
  badgeBorder:    '#bfdbfe',
  badgeText:      '#1d4ed8',

  footerBg:       'rgba(219,234,254,0.5)',
  collapseText:   '#60a5fa',
  scrollThumb:    'rgba(147,197,253,0.5)',
  scrollHover:    'rgba(96,165,250,0.6)',
};

// ── Heading level config ─────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  1: { indent: 0,  size: '13px',   weight: 700, color: '#1e3a5f' },
  2: { indent: 12, size: '12.5px', weight: 600, color: '#1d4ed8' },
  3: { indent: 24, size: '12px',   weight: 500, color: '#2563eb' },
  4: { indent: 36, size: '11.5px', weight: 400, color: '#3b82f6' },
  5: { indent: 44, size: '11px',   weight: 400, color: '#60a5fa' },
  6: { indent: 52, size: '11px',   weight: 400, color: '#93c5fd' },
};

const DOT_COLORS = {
  1: '#1e3a5f',
  2: '#1d4ed8',
  3: '#2563eb',
  4: '#3b82f6',
  5: '#60a5fa',
  6: '#93c5fd',
};

export const DocumentOutline = ({
  isOpen,
  onClose,
  headings = [],
  onHeadingClick,
  documentTitle = 'Untitled Document',
  collapsedSections,
  onToggleCollapse,
  activeHeadingId,
  className,
}) => {
  const [search, setSearch]       = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const searchRef = useRef(null);
  const listRef   = useRef(null);

  // Ctrl/Cmd+F → focus search
  useEffect(() => {
    const handler = (e) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Auto-scroll active heading into view
  useEffect(() => {
    if (!activeHeadingId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-heading-id="${activeHeadingId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeHeadingId]);

  const filtered = search.trim()
    ? headings.filter(h => h.text?.toLowerCase().includes(search.toLowerCase()))
    : headings;

  // Fix: Optimize hasChildren from O(n²) to O(1) lookup after O(n) precomputation
  const childrenMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      let hasChild = false;
      
      // Check if next heading is a child (deeper level)
      if (i + 1 < headings.length && headings[i + 1].level > heading.level) {
        hasChild = true;
      }
      
      map.set(heading.id, hasChild);
    }
    return map;
  }, [headings]);

  const isVisible = useCallback((heading, index) => {
    if (!collapsedSections) return true;
    for (let i = index - 1; i >= 0; i--) {
      const ancestor = headings[i];
      if (ancestor.level >= heading.level) continue;
      if (collapsedSections.has(ancestor.id)) return false;
    }
    return true;
  }, [headings, collapsedSections]);

  const hasChildren = useCallback((heading) => {
    return childrenMap.get(heading.id) || false;
  }, [childrenMap]);

  if (!isOpen) return null;

  return (
    <aside
      className={`flex flex-col h-full select-none ${className || ''}`}
      style={{
        width: '240px',
        minWidth: '200px',
        maxWidth: '300px',
        background: T.bg,
        borderRight: `1px solid ${T.border}`,
        fontFamily: '"DM Sans" "Geist", system-ui, sans-serif',
        userSelect: 'none', // Prevent selection in outline panel
        WebkitUserSelect: 'none', // Safari support
        MozUserSelect: 'none', // Firefox support
        msUserSelect: 'none', // IE/Edge support
        position: 'sticky', // Sticky positioning - stays in place while scrolling within parent
        top: 0,
        left: 0,
        zIndex: 100, // Match dropdown z-index to prevent being covered
        flexShrink: 0, // Prevent panel from shrinking
        flexGrow: 0, // Prevent panel from growing
        height: '100%', // Explicit full height
        alignSelf: 'stretch', // Stretch to fill parent
        overflow: 'hidden', // Prevent panel itself from scrolling
      }}
      aria-label="Document outline"
      onMouseDown={(e) => {
        // Allow clicks on interactive elements (headings, buttons)
        // Only prevent default for non-interactive areas
        const target = e.target;
        if (target.closest('[role="button"]') || target.closest('button')) {
          // Allow button clicks to work normally
          return;
        }
        // Prevent selection for other areas
        e.preventDefault();
      }}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          padding: '14px 14px 10px',
          borderBottom: `1px solid ${T.border}`,
          background: T.headerBg,
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '7px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.28)',
              flexShrink: 0,
            }}>
              <AlignLeft style={{ width: '12px', height: '12px', color: '#fff', strokeWidth: 2.5 }} />
            </div>
            <span style={{
              fontSize: '11.5px', fontWeight: 700,
              letterSpacing: '0.09em',
              color: T.textSecondary,
              textTransform: 'uppercase',
            }}>
              Outline
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close outline"
            style={{
              width: '26px', height: '26px', borderRadius: '7px',
              border: `1px solid ${T.border}`,
              background: T.inputBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
              color: T.textMuted,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = T.textSecondary;
              e.currentTarget.style.borderColor = T.activeBar;
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.inputBg;
              e.currentTarget.style.color = T.textMuted;
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <X style={{ width: '11px', height: '11px', strokeWidth: 2.5 }} />
          </button>
        </div>

        {/* Document title pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 10px', borderRadius: '8px',
          background: T.titleBg,
          border: `1px solid ${T.borderSubtle}`,
          boxShadow: '0 1px 3px rgba(37,99,235,0.06)',
          marginBottom: '8px',
        }}>
          <FileText style={{ width: '12px', height: '12px', color: T.iconAccent, flexShrink: 0 }} />
          <span
            title={documentTitle}
            style={{
              fontSize: '12px', fontWeight: 500,
              color: T.textPrimary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}
          >
            {documentTitle}
          </span>
        </div>

        {/* Search bar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '6px 10px', borderRadius: '8px',
            background: T.inputBg,
            border: `1px solid ${T.inputBorder}`,
            boxShadow: '0 1px 3px rgba(37,99,235,0.06)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = T.inputFocus;
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = T.inputBorder;
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(37,99,235,0.06)';
          }}
        >
          <Search style={{ width: '11px', height: '11px', color: T.textMuted, flexShrink: 0 }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Filter headings…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent',
              border: 'none', outline: 'none',
              fontSize: '12px', color: T.textPrimary,
              lineHeight: 1.4,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: T.textMuted, lineHeight: 1, display: 'flex' }}
            >
              <X style={{ width: '10px', height: '10px' }} />
            </button>
          )}
        </div>
      </header>

      {/* ── HEADINGS LIST ───────────────────────────────────────────────────── */}
      <nav
        ref={listRef}
        style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}
        aria-label="Document sections"
      >
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '120px',
            padding: '24px 16px', textAlign: 'center', gap: '10px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.75)',
              border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(37,99,235,0.08)',
            }}>
              <Hash style={{ width: '16px', height: '16px', color: T.textFaint }} />
            </div>
            <p style={{ fontSize: '12px', color: T.textMuted, lineHeight: 1.55, margin: 0 }}>
              {search
                ? `No headings match "${search}"`
                : 'Add headings to your document to see the outline here.'}
            </p>
          </div>
        ) : (
          filtered.map((heading, index) => {
            const cfg          = LEVEL_CONFIG[heading.level] || LEVEL_CONFIG[6];
            const isCollapsed  = collapsedSections?.has(heading.id);
            const _hasChildren = hasChildren(heading);
            const isActive     = heading.id === activeHeadingId;
            const isHovered    = hoveredId === heading.id;

            if (!search && !isVisible(heading, headings.indexOf(heading))) return null;

            return (
              <div key={`${heading.id}-${index}`} data-heading-id={heading.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onHeadingClick?.(heading.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onHeadingClick?.(heading.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredId(heading.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    paddingLeft: `${cfg.indent + 14}px`,
                    paddingRight: '10px',
                    paddingTop: '5px', paddingBottom: '5px',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    background: isActive ? T.activeBg : isHovered ? T.hoverBg : 'transparent',
                    borderLeft: isActive ? `2px solid ${T.activeBar}` : '2px solid transparent',
                  }}
                >
                  {/* Collapse toggle or level dot */}
                  {_hasChildren ? (
                    <button
                      onClick={e => { e.stopPropagation(); onToggleCollapse?.(heading.id); }}
                      aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                      style={{
                        flexShrink: 0, width: '14px', height: '14px',
                        borderRadius: '4px',
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isHovered || isActive ? T.activeBar : T.textFaint,
                        opacity: isHovered || isActive ? 1 : 0.6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <ChevronRight style={{
                        width: '10px', height: '10px',
                        transition: 'transform 0.2s',
                        transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                      }} />
                    </button>
                  ) : (
                    <span style={{
                      flexShrink: 0, width: '14px', height: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        width: heading.level <= 2 ? '5px' : '4px',
                        height: heading.level <= 2 ? '5px' : '4px',
                        borderRadius: '50%',
                        background: isActive ? T.activeBar : DOT_COLORS[heading.level] || T.textFaint,
                        opacity: isActive ? 1 : 0.55,
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }} />
                    </span>
                  )}

                  {/* Heading text */}
                  <span style={{
                    flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontSize: cfg.size,
                    fontWeight: isActive ? 700 : cfg.weight,
                    color: isActive ? T.textPrimary : isHovered ? T.textSecondary : cfg.color,
                    letterSpacing: heading.level === 1 ? '-0.01em' : 'normal',
                    lineHeight: 1.35,
                    transition: 'color 0.12s',
                  }}>
                    {heading.text}
                  </span>

                  {/* H-level badge — on hover only */}
                  <span style={{
                    flexShrink: 0,
                    fontSize: '9px', fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: T.textMuted,
                    fontFamily: 'monospace',
                    opacity: isHovered || isActive ? 1 : 0,
                    transition: 'opacity 0.15s',
                  }}>
                    H{heading.level}
                  </span>
                </div>

                {/* Collapsed children count */}
                {isCollapsed && _hasChildren && (
                  <div style={{
                    paddingLeft: `${cfg.indent + 34}px`,
                    paddingTop: '2px', paddingBottom: '3px',
                    fontSize: '10.5px',
                    color: T.collapseText,
                    fontStyle: 'italic', letterSpacing: '0.02em',
                  }}>
                    {(() => {
                      const start = headings.indexOf(heading) + 1;
                      let count = 0;
                      for (let j = start; j < headings.length; j++) {
                        if (headings[j].level <= heading.level) break;
                        count++;
                      }
                      return `${count} section${count !== 1 ? 's' : ''} hidden`;
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '9px 14px',
        borderTop: `1px solid ${T.border}`,
        background: T.footerBg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}>
        {/* Level breakdown badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[1, 2, 3].map(level => {
            const count = headings.filter(h => h.level === level).length;
            if (count === 0) return null;
            return (
              <span key={level} style={{
                fontSize: '10px', fontWeight: 700,
                color: T.badgeText,
                background: T.badgeBg,
                border: `1px solid ${T.badgeBorder}`,
                borderRadius: '4px', padding: '1px 5px',
                fontFamily: 'monospace', letterSpacing: '0.02em',
              }}>
                H{level}·{count}
              </span>
            );
          })}
        </div>

        {/* Total / filtered count */}
        <span style={{ fontSize: '11px', color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>
          {search && filtered.length !== headings.length
            ? `${filtered.length} / ${headings.length}`
            : `${headings.length} heading${headings.length !== 1 ? 's' : ''}`}
        </span>
      </footer>

      {/* ── SCOPED STYLES ──────────────────────────────────────────────────── */}
      <style>{`
        aside[aria-label="Document outline"] ::-webkit-scrollbar { width: 3px; }
        aside[aria-label="Document outline"] ::-webkit-scrollbar-track { background: transparent; }
        aside[aria-label="Document outline"] ::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 99px; }
        aside[aria-label="Document outline"] ::-webkit-scrollbar-thumb:hover { background: ${T.scrollHover}; }
        aside[aria-label="Document outline"] input::placeholder { color: ${T.textPlaceholder}; }
        aside[aria-label="Document outline"] button:focus-visible { outline: 2px solid ${T.activeBar}; outline-offset: 2px; }
        aside[aria-label="Document outline"] [role="button"]:focus-visible { outline: 2px solid ${T.activeBar}; outline-offset: -2px; }
      `}</style>
    </aside>
  );
};