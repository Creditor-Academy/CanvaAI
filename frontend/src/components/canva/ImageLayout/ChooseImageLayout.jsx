import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { layoutPresetSections, quickStartOptions } from './layoutPresets';

const PREVIEW_BOX_H = 152;
const PREVIEW_MAX_W = 128;
const PREVIEW_MAX_H = 140;

/** Size preview width-first (fills card width), then clamp height */
function fitPreviewSize(canvasW, canvasH, boxW, boxH) {
  const ratio = canvasW / canvasH;
  let w = boxW;
  let h = w / ratio;
  if (h > boxH) {
    h = boxH;
    w = h * ratio;
  }
  return { w, h };
}

function LayoutPreview({ width, height, accent, thumbnail, name }) {
  const [imgFailed, setImgFailed] = useState(false);
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  const showImage = thumbnail && !imgFailed;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !showImage) return;

    const update = () => setContainerW(el.clientWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showImage]);

  if (showImage) {
    const maxInnerH = PREVIEW_BOX_H - 8;
    const boxW = containerW > 0 ? containerW - 4 : PREVIEW_MAX_W;
    const { w, h } = fitPreviewSize(width, height, boxW, maxInnerH);

    return (
      <div
        ref={containerRef}
        className="flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#ececec] px-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-[1.02]"
        style={{ height: PREVIEW_BOX_H }}
      >
        <div
          className="overflow-hidden rounded-md bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          style={{ width: w, height: h, maxWidth: '100%' }}
        >
          <img
            src={thumbnail}
            alt=""
            className="block h-full w-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        </div>
      </div>
    );
  }

  const ratio = width / height;
  let w = PREVIEW_MAX_W;
  let h = w / ratio;
  if (h > PREVIEW_MAX_H) {
    h = PREVIEW_MAX_H;
    w = h * ratio;
  }

  return (
    <div
      className="flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#ececec]"
      style={{ height: PREVIEW_BOX_H }}
    >
      <div
        className="overflow-hidden rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-transform duration-200 group-hover:scale-105"
        style={{
          width: w,
          height: h,
          background: accent || 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      />
      <span className="sr-only">{name} preview</span>
    </div>
  );
}

const accentForLayout = (id) => {
  const map = {
    default: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
    banner: 'linear-gradient(135deg, #ffedd5 0%, #fb923c 100%)',
    mobile: 'linear-gradient(135deg, #fce7f3 0%, #f472b6 100%)',
    'youtube-thumb': 'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)',
    'facebook-post': 'linear-gradient(135deg, #dbeafe 0%, #2563eb 100%)',
    'linkedin-bg': 'linear-gradient(135deg, #bfdbfe 0%, #1d4ed8 100%)',
    'instagram-story': 'linear-gradient(135deg, #fbcfe8 0%, #db2777 100%)',
    'whatsapp-status': 'linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%)',
    'instagram-post-45': 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)',
    'facebook-cover': 'linear-gradient(135deg, #93c5fd 0%, #1e40af 100%)',
    'twitter-post': 'linear-gradient(135deg, #e0e7ff 0%, #0f172a 100%)',
    'pinterest-pin': 'linear-gradient(135deg, #fee2e2 0%, #dc2626 100%)',
    'facebook-carousel': 'linear-gradient(135deg, #dbeafe 0%, #2563eb 100%)',
  };
  return map[id] || 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)';
};

const QuickStartCard = ({ option, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(option)}
    className="group flex w-full flex-col gap-2 rounded-xl p-1 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
  >
    <LayoutPreview
      width={option.width || 1920}
      height={option.height || 1080}
      accent={option.accent}
      thumbnail={option.thumbnail}
      name={option.name}
    />
    <p className="px-0.5 text-[13px] font-semibold leading-tight text-slate-900 group-hover:text-violet-700">
      {option.name}
    </p>
  </button>
);

const LayoutCard = ({ layout, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(layout)}
    className="group flex w-full flex-col gap-2 rounded-xl p-1 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
  >
    <LayoutPreview
      width={layout.width}
      height={layout.height}
      accent={accentForLayout(layout.id)}
      thumbnail={layout.thumbnail}
      name={layout.name}
    />
    <div className="px-0.5">
      <p className="text-[13px] font-semibold leading-tight text-slate-900 group-hover:text-violet-700">
        {layout.name}
      </p>
      {layout.subtitle && (
        <p className="text-[11px] text-slate-500">{layout.subtitle}</p>
      )}
      <p className="mt-0.5 text-[11px] text-slate-400">
        {layout.width} × {layout.height} px
      </p>
    </div>
  </button>
);

const ChooseImageLayout = ({
  open,
  onClose,
  onSelect,
  showQuickStart = false,
  onQuickStartSelect,
  title = 'Create a design',
}) => {
  const [query, setQuery] = useState('');

  const filteredQuickStart = useMemo(() => {
    if (!showQuickStart) return [];
    const q = query.trim().toLowerCase();
    if (!q) return quickStartOptions;
    return quickStartOptions.filter((item) => item.name.toLowerCase().includes(q));
  }, [query, showQuickStart]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return layoutPresetSections;

    return layoutPresetSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            `${item.width}x${item.height}`.includes(q.replace(/\s/g, '')) ||
            `${item.width} ${item.height}`.includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  const hasResults =
    filteredQuickStart.length > 0 || filteredSections.some((s) => s.items.length > 0);

  if (!open) return null;

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (layout) => {
    setQuery('');
    onSelect(layout);
  };

  const handleQuickStart = (option) => {
    setQuery('');
    onQuickStartSelect?.(option);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="choose-layout-title"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="choose-layout-title" className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <FiX size={22} />
            </button>
          </div>

          <div className="relative">
            <FiSearch
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to create?"
              className="w-full rounded-full border border-violet-200 bg-white py-3 pl-11 pr-4 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!hasResults ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No designs match your search.
            </p>
          ) : (
            <>
              {showQuickStart && filteredQuickStart.length > 0 && (
                <section className="mb-8">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:max-w-md">
                    {filteredQuickStart.map((option) => (
                      <QuickStartCard
                        key={option.id}
                        option={option}
                        onSelect={handleQuickStart}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredSections.map((section) =>
                section.items.length > 0 ? (
                  <section key={section.id} className="mb-8 last:mb-2">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">{section.title}</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
                      {section.items.map((layout) => (
                        <LayoutCard key={layout.id} layout={layout} onSelect={handleSelect} />
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChooseImageLayout;
