import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiPlus, FiFileText, FiLayout, FiClock } from 'react-icons/fi';
import { Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listPresentations, deletePresentation, getAdminTemplates, savePresentation, getPublicTemplateById } from '../services/presentation';
import PresentationThumbnail from '../components/PresentationThumbnail';
import TemplatePreviewModal from '../components/presentation3/TemplatePreviewModal';
import SkeletonCard from '../components/SkeletonCard';

const Presentation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [presentations, setPresentations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Inject animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes wave {
        0% { transform: translateX(0) translateZ(0) scaleY(1); }
        50% { transform: translateX(-25%) translateZ(0) scaleY(0.8); }
        100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
      }

      @keyframes borderTrace {
        0% { background-position: 0% 0%; }
        25% { background-position: 100% 0%; }
        50% { background-position: 100% 100%; }
        75% { background-position: 0% 100%; }
        100% { background-position: 0% 0%; }
      }

      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.08), 0 8px 32px rgba(0,0,0,0.04); }
        50% { box-shadow: 0 0 35px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0,0,0,0.06); }
      }

      .wave-bg {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: -1;
        overflow: hidden;
      }

      .wave {
        position: absolute;
        width: 200%;
        height: 100%;
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%);
        animation: wave 15s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
      }

      .wave:nth-child(2) {
        top: 30%;
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.02) 0%, rgba(168, 85, 247, 0.02) 100%);
        animation: wave 18s cubic-bezier(0.36, 0.45, 0.63, 0.53) -5s infinite;
      }

      .wave:nth-child(3) {
        top: 60%;
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.01) 0%, rgba(168, 85, 247, 0.01) 100%);
        animation: wave 20s cubic-bezier(0.36, 0.45, 0.63, 0.53) -2s infinite;
      }

      /* Tracing border animation for AI button */
      .ai-btn-wrapper {
        position: relative;
        border-radius: 24px;
        padding: 2px;
        background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
        background-size: 300% 300%;
        animation: borderTrace 4s linear infinite;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      }

      .ai-btn-wrapper:hover {
       box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      }

      .ai-btn-inner {
        border-radius: 22px;
        background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%);
        padding: 32px;
        display: flex;
        align-items: center;
        gap: 24px;
        position: relative;
        overflow: hidden;
      }

      /* Tracing border animation for Create Fresh button */
      .fresh-btn-wrapper {
        position: relative;
        border-radius: 24px;
        padding: 2px;
        background: linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa, #0ea5e9, #1e40af);
        background-size: 300% 300%;
        animation: borderTrace 4s linear infinite;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      }

      .fresh-btn-wrapper:hover {
       
        box-shadow: 0 20px 25px -5px rgba(59,130,246,0.35), 0 10px 10px -5px rgba(59,130,246,0.15);
      }

      .fresh-btn-inner {
        border-radius: 22px;
        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 24px;
        position: relative;
        overflow: hidden;
      }

      /* Glowing section cards */
      .glow-card {
        -webkit-backdrop-filter: blur(12px);
        padding-y: 32px;
        transition: box-shadow 0.3s ease, transform 0.3s ease;
      }

      .skeleton {
        background: linear-gradient(
          90deg,
          #f0f0f0 25%,
          #e4e4e4 37%,
          #f0f0f0 63%
        );
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }

      @keyframes shimmer {
        0% { background-position: 100% 0 }
        100% { background-position: -100% 0 }
      }

      .fade-in {
        animation: fadeIn 0.25s ease-in forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes viewBtnPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(10,93,187,0.4); }
        50%       { box-shadow: 0 0 0 6px rgba(10,93,187,0); }
      }
      .view-btn {
        padding: 6px 14px;
        border-radius: 8px;
        border: 1.5px solid #0a5dbb;
        background: transparent;
        color: #0a5dbb;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
        transition: color 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.15s ease;
        letter-spacing: 0.01em;
      }
      .view-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%);
        background-size: 200% 100%;
        background-position: 200% center;
        transition: background-position 0s;
        pointer-events: none;
      }
      .view-btn:hover {
        background: linear-gradient(135deg, #0a5dbb 0%, #1d7bff 100%);
        border-color: transparent;
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(10,93,187,0.35), 0 1px 4px rgba(10,93,187,0.2);
      }
      .view-btn:hover::before {
        background-position: -200% center;
        transition: background-position 0.6s ease;
      }
      .view-btn:active {
        transform: translateY(0px) scale(0.97);
        box-shadow: 0 2px 6px rgba(10,93,187,0.3);
        animation: viewBtnPulse 0.4s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const res = await listPresentations(user._id);
        const list = Array.isArray(res) ? res : (res.data || []);
        const sortedList = list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setPresentations(sortedList);
      } catch (error) {
        console.error("Failed to fetch presentations:", error);
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
        console.error("Failed to fetch templates:", error);
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
      } catch (e) { return null; }
    }
    // Return first slide or the data itself if it has layers
    return data.slides?.[0] || (data.layers ? data : null);
  };

  const getSlideCount = (item) => {
    if (item.slideCount !== undefined) return item.slideCount;
    const data = getSlideData(item);
    if (!data) return 0;
    // If it has slides array
    let rawData = item.data;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }
    if (Array.isArray(rawData?.slides)) return rawData.slides.length;
    return rawData?.layers ? 1 : 0;
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();

    setIsDeleting(id);
    try {
      await deletePresentation(id, user._id);
      setPresentations(prev => prev.filter(ppt => ppt._id !== id));
    } catch (error) {
      console.error("Failed to delete presentation:", error);
      alert("Failed to delete presentation.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPresentations = presentations.filter(p =>
    (p.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseTemplate = async (template) => {
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
      console.error("Error fetching template preview:", error);
      alert("Failed to load template preview.");
    }
  };

  return (
    <>
      <div className="min-h-screen">
        {/* Wave Animation Background */}
        <div className="wave-bg">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>

        <div className="min-h-screen bg-transparent pb-10 relative">
          <div className="mx-auto flex flex-col gap-10">
            {/* Header Section */}
            <div className="mb-2.5">
              <div>
                <h1 className="font-serif text-[clamp(40px,8vw,64px)] font-normal tracking-tighter leading-[1.1] text-slate-900 m-0">Create Stunning Presentation's.</h1>
                <p className="font-sans text-[1.1rem] text-slate-500 mt-2 font-normal"> "Create professional presentations in seconds with AI or start from scratch."</p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6">
              {/* Create with AI — animated tracing border */}
              <div
                className="ai-btn-wrapper"
                onClick={() => window.open('/dashboard/ai-presentation', '_blank')}
              >
                <div className="ai-btn-inner">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles size={32} color="#fff" />
                  </div>
                  <div>
                    <h2 className="font-sans text-2xl font-bold m-0 text-white">Create with AI</h2>
                    <p className="font-sans text-base mt-1 text-white/80">
                      Let AI generate a complete presentation from your topic.
                    </p>
                  </div>
                  <div className="absolute -right-2.5 -bottom-2.5 opacity-50">
                    <FiZap size={24} color="rgba(255,255,255,0.2)" />
                  </div>
                </div>
              </div>

              {/* Create Fresh */}
              <div
                className="fresh-btn-wrapper"
                onClick={() => window.open('/presentation-editor-v3', '_blank')}
              >
                <div className="fresh-btn-inner">

                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#0ea5e9] shadow-[0_10px_20px_rgba(59,130,246,0.35)]"
                  >
                    <FiPlus size={28} color="#ffffff" />
                  </div>

                  <div>
                    <h2 className="font-sans text-2xl font-bold m-0 text-slate-900">Create Fresh</h2>
                    <p className="font-sans text-base mt-1 text-slate-500">
                      Open our advanced editor and start your story from scratch.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Recent Work Section — Glowing Card */}
            <div className="glow-card">
              <div className="flex items-center gap-2.5 text-slate-900 mb-5 justify-between flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-[1.6rem] font-normal m-0 text-slate-900 tracking-tight">Recent Presentations</h2>
                  {!loading && (
                    <span className="font-sans text-[0.8rem] font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-[3px] rounded-full whitespace-nowrap">{filteredPresentations.length} {filteredPresentations.length === 1 ? 'presentation' : 'presentations'}</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search presentations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-sans text-[0.9rem] text-slate-900 outline-none w-[220px] focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="overflow-y-auto pr-2.5 custom-scrollbar">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : filteredPresentations.length === 0 ? (
                  <div className="p-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-500">
                    <p className="font-sans">{searchTerm ? 'No presentations match your search.' : 'No presentations yet. Start creating!'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 fade-in">
                    {filteredPresentations.map((ppt) => (
                      <div
                        key={ppt._id}
                        onClick={() => window.open(`/presentation-editor-v3/${ppt._id}?template=false`, '_blank')}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:border-indigo-500 group"
                      >
                        <div className="h-[140px] bg-slate-100 flex items-center justify-center relative">
                          {getSlideData(ppt) ? (
                            <>
                              <PresentationThumbnail slide={getSlideData(ppt)} width="100%" height="100%" />
                              {/* Slide Count Overlay */}
                              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                                <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 border border-indigo-100">
                                  <FiLayout size={13} className="text-indigo-600" />
                                  <span className="text-[0.7rem] font-extrabold text-slate-800 uppercase tracking-tight">
                                    {getSlideCount(ppt)} {getSlideCount(ppt) === 1 ? 'Slide' : 'Slides'}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <FiFileText size={40} className="text-slate-400" />
                          )}
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <div className="overflow-hidden">
                            <h3 className="font-sans text-base font-semibold m-0 whitespace-nowrap overflow-hidden text-ellipsis text-slate-900">{ppt.title || "Untitled"}</h3>
                            <div className="flex items-center gap-2">
                              <p className="font-sans text-[0.85rem] text-slate-500 mt-0.5">{new Date(ppt.updatedAt).toLocaleDateString()}</p>
                              {getSlideCount(ppt) > 0 && (
                                <div className="inline-flex items-center text-[0.75rem] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-xl font-semibold mt-1">
                                  <FiLayout size={12} className="mr-1" />
                                  {getSlideCount(ppt)} {getSlideCount(ppt) === 1 ? 'Slide' : 'Slides'}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(ppt._id, e)}
                            className={`p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors ${isDeleting === ppt._id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            disabled={isDeleting === ppt._id}
                          >
                            {isDeleting === ppt._id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Templates Section — Glowing Card */}
            <div className="glow-card">
              <div className="flex items-center gap-2.5 text-slate-900 mb-5">
                <FiLayout size={20} className="text-slate-900" />
                <h2 className="font-serif text-[1.6rem] font-normal m-0 text-slate-900 tracking-tight">Featured Templates</h2>
              </div>

              <div className="overflow-y-auto pr-2.5 custom-scrollbar mt-5">
                {templatesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 fade-in">
                    {templates.map((tpl) => (
                      <div
                        key={tpl._id}
                        onClick={() => handleViewTemplate(tpl)}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:border-indigo-500 group"
                      >
                        <div className="h-[140px] bg-indigo-50 flex items-center justify-center relative">
                          {getSlideData(tpl) ? (
                            <>
                              <PresentationThumbnail slide={getSlideData(tpl)} width="100%" height="100%" />
                              {/* Slide Count Overlay */}
                              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                                <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 border border-indigo-100">
                                  <FiLayout size={13} className="text-indigo-600" />
                                  <span className="text-[0.7rem] font-extrabold text-slate-800 uppercase tracking-tight">
                                    {getSlideCount(tpl)} {getSlideCount(tpl) === 1 ? 'Slide' : 'Slides'}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <FiLayout size={40} className="text-indigo-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>


            </div>

            <TemplatePreviewModal
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              templateData={previewData}
              onImport={() => {
                setIsPreviewOpen(false);
                handleUseTemplate({ _id: selectedTemplateId });
              }}
            />

          </div>
        </div>
      </div>
    </>
  );
};

export default Presentation;
