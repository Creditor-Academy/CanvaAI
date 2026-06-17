import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Trash2, Sparkles, LayoutGrid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardNavbar } from '../contexts/DashboardNavbarContext';
import {
  listPresentations,
  deletePresentation,
  getAdminTemplates,
  getPublicTemplateById,
} from '../services/presentation';
import PresentationThumbnail from '../components/PresentationThumbnail';
import TemplatePreviewModal from '../components/presentation3/TemplatePreviewModal';
import SkeletonCard from '../components/SkeletonCard';

const RECENT_PER_PAGE = 4;
const TEMPLATES_PER_PAGE = 8;

const Presentation = () => {
  const { user } = useAuth();

  const [presentations, setPresentations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [presentationPage, setPresentationPage] = useState(0);
  const [templatePage, setTemplatePage] = useState(0);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const navbarConfig = useMemo(
    () => ({
      search: {
        placeholder: 'Search presentations...',
        value: searchTerm,
        onChange: setSearchTerm,
      },
    }),
    [searchTerm]
  );

  useDashboardNavbar(navbarConfig);

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const res = await listPresentations(user._id);
        const list = Array.isArray(res) ? res : res.data || [];
        setPresentations(
          list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        );
      } catch (error) {
        console.error('Failed to fetch presentations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?._id]);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await getAdminTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const getSlideData = (item) => {
    if (!item?.data) return null;
    let data = item.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return null;
      }
    }
    return data.slides?.[0] || (data.layers ? data : null);
  };

  const getSlideCount = (item) => {
    if (item.slideCount !== undefined) return item.slideCount;
    let rawData = item.data;
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(rawData?.slides)) return rawData.slides.length;
    return rawData?.layers ? 1 : 0;
  };

  const getTemplateTitle = (tpl) =>
    tpl.title || tpl.name || 'Untitled Template';

  const getTemplateCategory = (tpl) => {
    const raw = tpl.category || tpl.tags?.[0] || 'Corporate';
    return String(raw);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      await deletePresentation(id, user._id);
      setPresentations((prev) => prev.filter((ppt) => ppt._id !== id));
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      alert('Failed to delete presentation.');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPresentations = useMemo(
    () =>
      presentations.filter((p) =>
        (p.title || 'Untitled')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [presentations, searchTerm]
  );

  useEffect(() => {
    setPresentationPage(0);
    setShowAllRecent(false);
  }, [searchTerm]);

  const recentPerPage = showAllRecent
    ? filteredPresentations.length || RECENT_PER_PAGE
    : RECENT_PER_PAGE;

  const totalPresentationPages = Math.max(
    1,
    Math.ceil(filteredPresentations.length / recentPerPage)
  );
  const visiblePresentations = showAllRecent
    ? filteredPresentations
    : filteredPresentations.slice(
        presentationPage * RECENT_PER_PAGE,
        (presentationPage + 1) * RECENT_PER_PAGE
      );
  const hasNextPresentationPage =
    !showAllRecent && presentationPage < totalPresentationPages - 1;
  const hasPrevPresentationPage = !showAllRecent && presentationPage > 0;

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

  const handleUseTemplate = (template) => {
    const tplId = template._id || template.id;
    window.open(`/presentation-editor-v3/${tplId}?template=true`, '_blank');
  };

  const handleViewTemplate = async (template) => {
    const tplId = template._id || template.id;
    try {
      const data = await getPublicTemplateById(tplId);
      setPreviewData(data.data || data);
      setSelectedTemplateId(tplId);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error fetching template preview:', error);
      alert('Failed to load template preview.');
    }
  };

  const openEditor = (pptId) => {
    window.open(`/presentation-editor-v3/${pptId}?template=false`, '_blank');
  };

  return (
    <div className="relative min-h-full font-['Plus_Jakarta_Sans',sans-serif] text-[#121c2c]">
      <div className="w-full max-w-[1440px] mx-auto pb-12">
        {/* HERO */}
        <div className="mb-12 mt-4">
          <h2 className="mb-2 font-['Source_Serif_4',serif] text-[32px] font-semibold leading-snug text-[#121c2c]">
            Create Stunning Presentation&apos;s.
          </h2>
          <p className="mb-10 text-base leading-relaxed text-[#414751] opacity-80">
            &ldquo;Create professional presentations in seconds with AI or start
            from scratch.&rdquo;
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Create with AI */}
            <button
              type="button"
              onClick={() => window.open('/dashboard/ai-presentation', '_blank')}
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
                  Harness the power of AI to generate professional decks in
                  seconds.
                </p>
              </div>
              <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/20 blur-[80px] transition-transform duration-700 group-hover:scale-150" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            {/* Create Fresh */}
            <button
              type="button"
              onClick={() => window.open('/presentation-editor-v3', '_blank')}
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
                  Start with a blank canvas and build your story from the ground
                  up.
                </p>
              </div>
              <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#005ea1]/5 blur-3xl transition-all group-hover:bg-[#005ea1]/10" />
            </button>
          </div>
        </div>

        {/* RECENT PRESENTATIONS */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <h2 className="text-lg font-semibold text-[#121c2c]">
                Recent Presentations
              </h2>
              {!loading && (
                <span className="rounded-full bg-[#2178c3]/20 px-2 py-0.5 text-xs font-bold text-[#005ea1]">
                  {filteredPresentations.length}{' '}
                  {filteredPresentations.length === 1
                    ? 'presentation'
                    : 'presentations'}
                </span>
              )}
            </div>
            {!loading && filteredPresentations.length > RECENT_PER_PAGE && (
              <button
                type="button"
                onClick={() => {
                  setShowAllRecent((v) => !v);
                  setPresentationPage(0);
                }}
                className="text-sm font-medium text-[#005ea1] hover:underline"
              >
                {showAllRecent ? 'Show less' : 'View all'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredPresentations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#c0c7d3] bg-white/60 p-12 text-center text-[#414751]">
              {searchTerm
                ? 'No presentations match your search.'
                : 'No presentations yet. Start creating!'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {visiblePresentations.map((ppt) => (
                  <article
                    key={ppt._id}
                    onClick={() => openEditor(ppt._id)}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-transparent bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:border-[#2178c3]/30"
                  >
                    <div className="relative h-32 overflow-hidden bg-[#e7eeff]">
                      {getSlideData(ppt) ? (
                        <PresentationThumbnail
                          slide={getSlideData(ppt)}
                          width="100%"
                          height="100%"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FiFileText size={36} className="text-[#c0c7d3]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                    </div>

                    <div className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between">
                        <h4 className="truncate pr-2 text-sm font-semibold text-[#121c2c]">
                          {ppt.title || 'Untitled'}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(ppt._id, e)}
                          disabled={isDeleting === ppt._id}
                          className="text-[#ba1a1a] opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
                          aria-label="Delete presentation"
                        >
                          {isDeleting === ppt._id ? (
                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ba1a1a] border-t-transparent" />
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-[10px] font-bold leading-tight text-[#717782]">
                          {formatDate(ppt.updatedAt)}
                        </span>
                        {getSlideCount(ppt) > 0 && (
                          <span className="rounded-full bg-[#d8e4eb] px-2 py-0.5 text-[10px] font-bold text-[#111d22]">
                            {getSlideCount(ppt)}{' '}
                            {getSlideCount(ppt) === 1 ? 'Slide' : 'Slides'}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!showAllRecent &&
                filteredPresentations.length > RECENT_PER_PAGE && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!hasPrevPresentationPage}
                      onClick={() =>
                        setPresentationPage((p) => Math.max(0, p - 1))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-[#c0c7d3] bg-white px-5 py-2 text-sm font-medium text-[#121c2c] shadow-sm transition hover:shadow disabled:opacity-40"
                    >
                      <FiChevronLeft size={16} />
                      Previous
                    </button>
                    <span className="text-sm text-[#717782]">
                      Page {presentationPage + 1} of {totalPresentationPages}
                    </span>
                    <button
                      type="button"
                      disabled={!hasNextPresentationPage}
                      onClick={() =>
                        setPresentationPage((p) =>
                          hasNextPresentationPage ? p + 1 : p
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
                    onClick={() => handleViewTemplate(tpl)}
                    className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                  >
                    {getSlideData(tpl) ? (
                      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                        <PresentationThumbnail
                          slide={getSlideData(tpl)}
                          width="100%"
                          height="100%"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#d9e3f9]">
                        <FiFileText size={32} className="text-[#717782]" />
                      </div>
                    )}

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

      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        templateData={previewData}
        onImport={(previewTemplateId) => {
          setIsPreviewOpen(false);
          handleUseTemplate({ _id: previewTemplateId || selectedTemplateId });
        }}
      />
    </div>
  );
};

export default Presentation;
