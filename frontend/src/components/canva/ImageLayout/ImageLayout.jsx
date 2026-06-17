import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Sparkles, Trash2, LayoutGrid } from 'lucide-react';
import { getUserImages, deleteImage, getPublicTemplateImages, saveImage } from '@/services/imageEditor/imageApi';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardNavbar } from '@/contexts/DashboardNavbarContext';
import { toast } from 'sonner';
import ImagePopup from './imagePopup';
import { isTransparent, getShapeSVG } from './shapeUtils';
import ChooseImageLayout from './ChooseImageLayout';
import SkeletonCard from '@/components/SkeletonCard';

const RECENT_PER_PAGE = 4;
const TEMPLATES_PER_PAGE = 8;
const ITEMS_PER_PAGE = 20;

// ─── Thumbnail Preview ───────────────────────────────────────────────────────

export const ImageThumbPreview = memo(({ image }) => {
  const layers = Array.isArray(image?.data)
    ? image.data
    : image?.data?.layer || image?.data?.layers || [];
  const canvasSize =
    image?.data?.canvasSize || layers?.[0]?.canvasSize || { width: 800, height: 600 };
  const bgColor =
    image?.data?.canvasBgColor || layers?.[0]?.canvasBgColor || '#ffffff';
  const bgImage =
    image?.data?.canvasBgImage || layers?.[0]?.canvasBgImage || null;
  const isGradient = bgColor && bgColor.includes('gradient');

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        ...(isGradient
          ? { backgroundImage: bgColor }
          : {
              backgroundColor: isTransparent(bgColor) ? '#f8fafc' : bgColor,
            }),
        backgroundImage: isGradient
          ? bgColor
          : bgImage
            ? `url(${bgImage})`
            : 'none',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: canvasSize.width,
          height: canvasSize.height,
          transformOrigin: 'center',
          transform: 'translate(-50%, -50%) scale(var(--thumb-scale, 1))',
        }}
        className="pointer-events-none"
      >
        {layers?.map((layer) => {
          if (!layer || layer.visible === false) return null;
          const commonStyle = {
            position: 'absolute',
            left: layer.x || 0,
            top: layer.y || 0,
            width: layer.width || 0,
            height: layer.height || 0,
            transform: `rotate(${layer.rotation || 0}deg)`,
            transformOrigin: 'center center',
          };
          if (layer.type === 'text') {
            return (
              <div
                key={layer.id}
                style={{
                  ...commonStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: 4,
                  overflow: 'hidden',
                  fontSize: layer.fontSize || 16,
                  fontFamily: layer.fontFamily || 'Arial',
                  fontWeight: layer.fontWeight || 400,
                  fontStyle: layer.fontStyle || 'normal',
                  textDecoration: layer.textDecoration || 'none',
                  color: layer.color || '#111827',
                  textAlign: layer.textAlign || 'left',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.1,
                }}
              >
                {layer.text}
              </div>
            );
          }
          if (layer.type === 'image') {
            const src = layer.imageUrl || layer.url || layer.src;
            if (!src) return null;
            return (
              <img
                key={layer.id}
                src={src}
                alt={layer.name || ''}
                draggable={false}
                style={{
                  ...commonStyle,
                  objectFit: 'cover',
                  opacity: (layer.opacity ?? 100) / 100,
                  borderRadius: layer.cornerRadius || 0,
                  filter: `brightness(${layer.brightness || 100}%) contrast(${layer.contrast || 100}%) blur(${layer.blur || 0}px)`,
                }}
              />
            );
          }
          if (layer.type === 'shape') {
            if (layer.fillImageSrc && layer.fillType === 'image') {
              return (
                <div
                  key={layer.id}
                  style={{
                    ...commonStyle,
                    backgroundImage: `url(${layer.fillImageSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: `${layer.strokeWidth || 1}px solid ${layer.strokeColor || '#000000'}`,
                    opacity: (layer.opacity ?? 100) / 100,
                    borderRadius: layer.borderRadius || 0,
                  }}
                />
              );
            }
            const svgMarkup = getShapeSVG(
              layer.shape || 'roundedRectangle',
              layer.width || 100,
              layer.height || 100,
              layer.fillColor,
              layer.strokeColor,
              layer.strokeWidth
            );
            return (
              <div
                key={layer.id}
                style={{
                  position: 'absolute',
                  left: layer.x || 0,
                  top: layer.y || 0,
                  width: layer.width || 0,
                  height: layer.height || 0,
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: 'center center',
                  opacity: (layer.opacity ?? 100) / 100,
                }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
});

const ThumbnailFrame = ({ image, children }) => {
  const canvasSize = image?.data?.canvasSize || { width: 800, height: 600 };

  return (
    <div
      className="absolute inset-0"
      ref={(el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scale = Math.min(
          rect.width / (canvasSize.width || 800),
          rect.height / (canvasSize.height || 600)
        );
        el.style.setProperty('--thumb-scale', String(scale));
      }}
    >
      {children}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ImageLayout = () => {
  const { user, isAdmin } = useAuth();
  const userId = user?._id;

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [imagePage, setImagePage] = useState(0);
  const [templatePage, setTemplatePage] = useState(0);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [showImageLayoutModal, setShowImageLayoutModal] = useState(false);

  const navbarConfig = useMemo(
    () => ({
      search: {
        placeholder: 'Search images...',
        value: searchTerm,
        onChange: setSearchTerm,
      },
    }),
    [searchTerm]
  );

  useDashboardNavbar(navbarConfig);

  useEffect(() => {
    let mounted = true;
    const fetchImages = async () => {
      try {
        setLoading(true);
        const data = await getUserImages(userId, 1, ITEMS_PER_PAGE);
        if (mounted) {
          const arr = Array.isArray(data) ? data : data?.data || [];
          setImages(arr);
          setHasMore(arr.length === ITEMS_PER_PAGE);
          setPage(1);
        }
      } catch (err) {
        console.error('Load images error', err);
        if (mounted) setError('Failed to load images');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (userId) fetchImages();
    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await getPublicTemplateImages();
        let data = [];
        if (result?.status === 'success' && Array.isArray(result.data))
          data = result.data;
        else if (Array.isArray(result)) data = result;
        else if (result?.data && Array.isArray(result.data)) data = result.data;
        setTemplates(data);
      } catch (err) {
        console.error('Failed to load templates', err);
        toast.error('Failed to load templates');
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    setImagePage(0);
    setShowAllRecent(false);
  }, [searchTerm]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await getUserImages(userId, nextPage, ITEMS_PER_PAGE);
      const arr = Array.isArray(data) ? data : data?.data || [];
      if (arr.length > 0) {
        setImages((prev) => [...prev, ...arr]);
        setPage(nextPage);
        setHasMore(arr.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load more error', err);
      toast.error('Failed to load more images');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteClick = (imageId, e) => {
    e?.stopPropagation();
    setSelectedDeleteId(imageId);
    setShowDeletePopup(true);
  };

  const confirmDeleteImage = async () => {
    if (!selectedDeleteId) return;
    setIsDeleting(selectedDeleteId);
    try {
      await deleteImage(selectedDeleteId);
      setImages((prev) => prev.filter((img) => img._id !== selectedDeleteId));
      toast.success('Design deleted successfully');
    } catch (err) {
      console.error('Delete error', err);
      toast.error('Failed to delete design');
    } finally {
      setIsDeleting(null);
      setShowDeletePopup(false);
      setSelectedDeleteId(null);
    }
  };

  const handleImport = async (image) => {
    if (isAdmin) {
      const targetId = image.imageId || image._id;
      try {
        sessionStorage.setItem(
          `prefill_project_${targetId}`,
          JSON.stringify(image)
        );
      } catch {
        /* noop */
      }
      window.open(`/canva-clone/${targetId}`, '_blank');
      return;
    }
    try {
      const resp = await saveImage({
        userId: user?._id || user?.id,
        title: `${image.title || 'Untitled Template'}_copy`,
        data: image.data,
      });
      const newId = resp?.imageId || resp?.data?._id || resp?._id;
      if (newId) {
        try {
          sessionStorage.setItem(
            `prefill_project_${newId}`,
            JSON.stringify({
              title: `${image.title || 'Untitled Template'}_copy`,
              data: image.data,
            })
          );
          sessionStorage.setItem(`prefill_import_flag_${newId}`, '1');
        } catch {
          /* noop */
        }
        window.open(`/canva-clone/${newId}`, '_blank');
      }
      toast.success('Template imported to your account');
    } catch (err) {
      console.error('Clone/import failed', err);
      toast.error('Failed to import template');
    }
  };

  const handleLayoutSelect = (layout) => {
    setShowImageLayoutModal(false);
    try {
      sessionStorage.setItem(
        'new_layout_prefill',
        JSON.stringify({
          width: layout.width,
          height: layout.height,
          name: layout.name,
        })
      );
    } catch (e) {
      console.error(e);
    }
    window.open('/canva-clone', '_blank');
  };

  const filteredImages = useMemo(
    () =>
      images
        .filter((img) =>
          (img.title || 'Untitled')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [images, searchTerm]
  );

  const recentPerPage = showAllRecent
    ? filteredImages.length || RECENT_PER_PAGE
    : RECENT_PER_PAGE;

  const totalImagePages = Math.max(
    1,
    Math.ceil(filteredImages.length / recentPerPage)
  );
  const visibleImages = showAllRecent
    ? filteredImages
    : filteredImages.slice(
        imagePage * RECENT_PER_PAGE,
        (imagePage + 1) * RECENT_PER_PAGE
      );
  const hasNextImagePage = !showAllRecent && imagePage < totalImagePages - 1;
  const hasPrevImagePage = !showAllRecent && imagePage > 0;

  const totalTemplatePages = Math.max(
    1,
    Math.ceil(templates.length / TEMPLATES_PER_PAGE)
  );
  const visibleTemplates = templates.slice(
    templatePage * TEMPLATES_PER_PAGE,
    (templatePage + 1) * TEMPLATES_PER_PAGE
  );
  const hasNextTemplatePage = templatePage < totalTemplatePages - 1;
  const hasPrevTemplatePage = templatePage > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getTemplateTitle = (tpl) =>
    tpl.title || tpl.name || 'Untitled Template';

  const getTemplateCategory = (tpl) => {
    const raw = tpl.category || tpl.tags?.[0] || 'Design';
    return String(raw);
  };

  const getCanvasLabel = (tpl) => {
    const cs = tpl.data?.canvasSize || { width: 800, height: 600 };
    return `${cs.width}×${cs.height}`;
  };

  const openEditor = (imageId) => {
    window.open(`/canva-clone/${imageId}`, '_blank');
  };

  return (
    <>
      <div className="relative min-h-full font-['Plus_Jakarta_Sans',sans-serif] text-[#121c2c]">
        <div className="mx-auto w-full max-w-[1440px] pb-12">
          {/* HERO */}
          <div className="mb-12 mt-4">
            <h2 className="mb-2 font-['Source_Serif_4',serif] text-[32px] font-semibold leading-snug text-[#121c2c]">
              Create Stunning Images.
            </h2>
            <p className="mb-10 text-base leading-relaxed text-[#414751] opacity-80">
              &ldquo;Design professional visuals in seconds with AI or start from
              scratch.&rdquo;
            </p>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  window.open('/dashboard/create/ai-design', '_blank')
                }
                className="group relative flex cursor-pointer items-center gap-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#005ea1] to-[#7c4dff] p-8 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-[#005ea1]/20"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner backdrop-blur-md">
                  <Sparkles size={40} className="text-white" />
                </div>
                <div className="relative z-10 text-white">
                  <h3 className="mb-1 text-xl font-semibold tracking-tight">
                    Create with AI
                  </h3>
                  <p className="max-w-xs text-sm font-medium opacity-80">
                    Let AI generate a complete design from your topic.
                  </p>
                </div>
                <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/20 blur-[80px] transition-transform duration-700 group-hover:scale-150" />
              </button>

              <button
                type="button"
                onClick={() => setShowImageLayoutModal(true)}
                className="group relative flex cursor-pointer items-center gap-6 overflow-hidden rounded-[32px] border border-white/60 bg-white/40 p-8 text-left shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/60 hover:shadow-xl"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#d9e3f9] text-[#005ea1] shadow-sm">
                  <FiPlus size={40} />
                </div>
                <div className="relative z-10">
                  <h3 className="mb-1 text-xl font-semibold tracking-tight text-[#121c2c]">
                    Create Fresh
                  </h3>
                  <p className="max-w-xs text-sm text-[#414751]">
                    Open our advanced editor and start your story from scratch.
                  </p>
                </div>
                <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#005ea1]/5 blur-3xl transition-all group-hover:bg-[#005ea1]/10" />
              </button>
            </div>
          </div>

          {/* RECENT IMAGES */}
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-baseline gap-4">
                <h2 className="text-lg font-semibold text-[#121c2c]">
                  Recent Images
                </h2>
                {!loading && (
                  <span className="rounded-full bg-[#2178c3]/20 px-2 py-0.5 text-xs font-bold text-[#005ea1]">
                    {filteredImages.length}{' '}
                    {filteredImages.length === 1 ? 'image' : 'images'}
                  </span>
                )}
              </div>
              {!loading && filteredImages.length > RECENT_PER_PAGE && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllRecent((v) => !v);
                    setImagePage(0);
                  }}
                  className="text-sm font-medium text-[#005ea1] hover:underline"
                >
                  {showAllRecent ? 'Show less' : 'View all'}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 text-sm text-[#ba1a1a]">{error}</div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#c0c7d3] bg-white/60 p-12 text-center text-[#414751]">
                {searchTerm
                  ? 'No images match your search.'
                  : 'No images yet. Start creating!'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {visibleImages.map((image) => (
                    <article
                      key={image._id}
                      onClick={() => openEditor(image._id)}
                      className="group cursor-pointer overflow-hidden rounded-3xl border border-transparent bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:border-[#2178c3]/30"
                    >
                      <div className="relative h-32 overflow-hidden bg-[#e7eeff]">
                        <ThumbnailFrame image={image}>
                          <ImageThumbPreview image={image} />
                        </ThumbnailFrame>
                        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                      </div>

                      <div className="flex flex-col gap-2 p-4">
                        <div className="flex items-start justify-between">
                          <h4 className="truncate pr-2 text-sm font-semibold text-[#121c2c]">
                            {image.title || 'Untitled'}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(image._id, e)}
                            disabled={isDeleting === image._id}
                            className="text-[#ba1a1a] opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
                            aria-label="Delete image"
                          >
                            {isDeleting === image._id ? (
                              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ba1a1a] border-t-transparent" />
                            ) : (
                              <Trash2 size={20} />
                            )}
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-[10px] font-bold leading-tight text-[#717782]">
                            {formatDate(image.createdAt)}
                          </span>
                          <span className="rounded-full bg-[#d8e4eb] px-2 py-0.5 text-[10px] font-bold text-[#111d22]">
                            {getCanvasLabel(image)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {!showAllRecent && filteredImages.length > RECENT_PER_PAGE && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!hasPrevImagePage}
                      onClick={() =>
                        setImagePage((p) => Math.max(0, p - 1))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-[#c0c7d3] bg-white px-5 py-2 text-sm font-medium text-[#121c2c] shadow-sm transition hover:shadow disabled:opacity-40"
                    >
                      <FiChevronLeft size={16} />
                      Previous
                    </button>
                    <span className="text-sm text-[#717782]">
                      Page {imagePage + 1} of {totalImagePages}
                    </span>
                    <button
                      type="button"
                      disabled={!hasNextImagePage}
                      onClick={() =>
                        setImagePage((p) =>
                          hasNextImagePage ? p + 1 : p
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-[#c0c7d3] bg-white px-5 py-2 text-sm font-medium text-[#121c2c] shadow-sm transition hover:shadow disabled:opacity-40"
                    >
                      Next
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}

                {hasMore && !searchTerm && !loading && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-full border border-[#c0c7d3] bg-white px-6 py-2.5 text-sm font-medium text-[#121c2c] shadow-sm transition hover:shadow disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#005ea1] border-t-transparent" />
                          Loading...
                        </>
                      ) : (
                        'Load more images'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* FEATURED TEMPLATES */}
          <section>
            <div className="mb-8 flex items-center gap-3">
              <LayoutGrid size={22} className="text-[#005ea1]" />
              <h2 className="font-['Source_Serif_4',serif] text-2xl font-semibold text-[#121c2c]">
                Featured Templates
              </h2>
            </div>

            {templatesLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} variant="template" />
                ))}
              </div>
            ) : visibleTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c0c7d3] bg-white/60 p-12 text-center text-[#414751]">
                No templates available yet.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {visibleTemplates.map((tpl) => (
                    <button
                      key={tpl._id}
                      type="button"
                      onClick={() => setSelectedImage(tpl)}
                      className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                    >
                      <div className="absolute inset-0 bg-[#e7eeff] transition-transform duration-500 group-hover:scale-110">
                        <ThumbnailFrame image={tpl}>
                          <ImageThumbPreview image={tpl} />
                        </ThumbnailFrame>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      <div className="absolute bottom-4 left-4 text-left text-white">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                          {getTemplateCategory(tpl)}
                        </p>
                        <h5 className="text-sm font-semibold">
                          {getTemplateTitle(tpl)}
                        </h5>
                      </div>
                    </button>
                  ))}
                </div>

                {templates.length > TEMPLATES_PER_PAGE && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!hasPrevTemplatePage}
                      onClick={() =>
                        setTemplatePage((p) => Math.max(0, p - 1))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-[#c0c7d3] bg-white px-5 py-2 text-sm font-medium text-[#121c2c] shadow-sm transition hover:shadow disabled:opacity-40"
                    >
                      <FiChevronLeft size={16} />
                      Previous
                    </button>
                    <span className="text-sm text-[#717782]">
                      Page {templatePage + 1} of {totalTemplatePages}
                    </span>
                    <button
                      type="button"
                      disabled={!hasNextTemplatePage}
                      onClick={() =>
                        setTemplatePage((p) =>
                          hasNextTemplatePage ? p + 1 : p
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-[#c0c7d3] bg-white px-5 py-2 text-sm font-medium text-[#121c2c] shadow-sm transition hover:shadow disabled:opacity-40"
                    >
                      Next
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {showDeletePopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm"
          onClick={() => {
            setShowDeletePopup(false);
            setSelectedDeleteId(null);
          }}
        >
          <div
            className="w-[90%] max-w-[420px] rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[18px] flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="m-0 text-[1.2rem] font-bold text-slate-900">
                  Delete Design
                </h3>
                <p className="mt-1 text-[0.92rem] text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="mb-6 text-[0.95rem] leading-relaxed text-slate-600">
              Are you sure you want to delete this design permanently?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedDeleteId(null);
                }}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-[18px] py-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteImage}
                className="cursor-pointer rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-[18px] py-[10px] font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ImagePopup
        image={selectedImage}
        thumbnail={null}
        onClose={() => setSelectedImage(null)}
        onImport={handleImport}
      />

      <ChooseImageLayout
        open={showImageLayoutModal}
        onClose={() => setShowImageLayoutModal(false)}
        onSelect={handleLayoutSelect}
      />
    </>
  );
};

export default ImageLayout;
