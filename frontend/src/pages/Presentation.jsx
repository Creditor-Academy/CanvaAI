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
        transform: translateY(-4px);
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
  transform: translateY(-4px);
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
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 24px;
        border: 1px solid rgba(99, 102, 241, 0.1);
        padding: 32px;
        animation: glowPulse 4s ease-in-out infinite;
        transition: box-shadow 0.3s ease, transform 0.3s ease;
      }

      .glow-card:hover {
        box-shadow: 0 0 45px rgba(99, 102, 241, 0.2), 0 12px 40px rgba(0,0,0,0.08);
        transform: translateY(-2px);
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
    <div style={{ background: "#e9f4ff", minHeight: "100vh" }}>
      {/* Wave Animation Background */}
      <div className="wave-bg">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <div style={styles.container}>
        <div style={styles.content}>
          {/* Header Section */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Create Stunning Presentation's.</h1>
              <p style={styles.subtitle}> "Create professional presentations in seconds with AI or start from scratch"</p>
            </div>
          </div>

          {/* Primary Actions */}
          <div style={styles.actionGrid}>
            {/* Create with AI — animated tracing border */}
            <div
              className="ai-btn-wrapper"
              onClick={() => window.open('/ai-presentation', '_blank')}
            >
              <div className="ai-btn-inner">
                <div style={styles.iconContainer}>
                  <Sparkles size={32} color="#fff" />
                </div>
                <div>
                  <h2 style={{ ...styles.actionTitle, color: '#fff' }}>Create with AI</h2>
                  <p style={{ ...styles.actionDesc, color: 'rgba(255,255,255,0.8)' }}>
                    Let AI generate a complete presentation from your topic.
                  </p>
                </div>
                <div style={styles.zapIcon}>
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
      style={{
        ...styles.iconContainer,
        background: 'linear-gradient(135deg, #1e40af, #3b82f6, #0ea5e9)',
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 20px rgba(59,130,246,0.35)'
      }}
    >
      <FiPlus size={28} color="#ffffff" />
    </div>

    <div>
      <h2 style={styles.actionTitle}>Create Fresh</h2>
      <p style={styles.actionDesc}>
        Open our advanced editor and start your story from scratch.
      </p>
    </div>

  </div>
</div>
          </div>

          {/* Recent Work Section — Glowing Card */}
          <div className="glow-card">
            <div style={{ ...styles.sectionHeader, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={styles.sectionTitle}>Recent Presentations</h2>
                {!loading && (
                  <span style={styles.countBadge}>{filteredPresentations.length} {filteredPresentations.length === 1 ? 'presentation' : 'presentations'}</span>
                )}
              </div>
              <input
                type="text"
                placeholder="Search presentations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.scrollContainer}>
              {loading ? (
                <div style={styles.grid}>
                  {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : filteredPresentations.length === 0 ? (
                <div style={styles.emptyCard}>
                  <p style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{searchTerm ? 'No presentations match your search.' : 'No presentations yet. Start creating!'}</p>
                </div>
              ) : (
                <div style={styles.grid} className="fade-in">
                  {filteredPresentations.map((ppt) => (
                    <div
                      key={ppt._id}
                      onClick={() => window.open(`/presentation-editor-v3/${ppt._id}?template=false`, '_blank')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = '#6366f1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                      style={styles.card}
                    >
                      <div style={styles.cardPreview}>
                        {getSlideData(ppt) ? (
                          <PresentationThumbnail slide={getSlideData(ppt)} width="100%" height="100%" />
                        ) : (
                          <FiFileText size={40} color="#94a3b8" />
                        )}
                      </div>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardText}>
                          <h3 style={styles.cardTitle}>{ppt.title || "Untitled"}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={styles.cardDate}>{new Date(ppt.updatedAt).toLocaleDateString()}</p>
                            {getSlideCount(ppt) > 0 && (
                              <div style={styles.slideBadge}>
                                <FiLayout size={12} style={{ marginRight: '4px' }} />
                                {getSlideCount(ppt)} {getSlideCount(ppt) === 1 ? 'Slide' : 'Slides'}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(ppt._id, e)}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          style={{
                            ...styles.deleteBtn,
                            opacity: isDeleting === ppt._id ? 0.6 : 1,
                            cursor: isDeleting === ppt._id ? 'not-allowed' : 'pointer'
                          }}
                          disabled={isDeleting === ppt._id}
                        >
                          {isDeleting === ppt._id ? (
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid #ef4444',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.6s linear infinite'
                            }} />
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
            <div style={styles.sectionHeader}>
              <FiLayout size={20} color="#0f172a" />
              <h2 style={styles.sectionTitle}>Featured Templates</h2>
            </div>

            <div style={{ ...styles.scrollContainer, marginTop: '20px' }}>
              {templatesLoading ? (
                <div style={styles.grid}>
                  {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div style={styles.grid} className="fade-in">
                  {templates.map((tpl) => (
                    <div
                      key={tpl._id}
                      onClick={() => handleViewTemplate(tpl)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = '#6366f1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                      style={styles.templateCard}
                    >
                      <div style={styles.templatePreview}>
                        {getSlideData(tpl) ? (
                          <PresentationThumbnail slide={getSlideData(tpl)} width="100%" height="100%" />
                        ) : (
                          <FiLayout size={40} color="#6366f1" />
                        )}
                      </div>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardText}>
                          <h3 style={styles.cardTitle}>{tpl.title}</h3>
                          {getSlideCount(tpl) > 0 && (
                            <div style={styles.slideBadge}>
                              <FiLayout size={12} style={{ marginRight: '4px' }} />
                              {getSlideCount(tpl)} {getSlideCount(tpl) === 1 ? 'Slide' : 'Slides'}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTemplate(tpl);
                            }}
                            className="view-btn"
                          >
                            View
                          </button>
                        </div>
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

const styles = {
  container: {
  minHeight: '100vh',
  background: 'transparent',
  padding: '120px 20px 40px',
  position: 'relative',
  zIndex: 1,
  transform: 'scale(0.9)',
  transformOrigin: 'top center',
},
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  header: {
    marginBottom: '10px',
  },
  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(40px, 8vw, 64px)',
    fontWeight: 400,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '1.1rem',
    color: '#64748b',
    marginTop: '8px',
    fontWeight: 400,
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  },
  actionCard: {
    padding: '32px',
    borderRadius: '24px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTitle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
  },
  actionDesc: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '1rem',
    margin: '4px 0 0',
  },
  zapIcon: {
    position: 'absolute',
    right: '-10px',
    bottom: '-10px',
    opacity: 0.5,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#0f172a',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '1.6rem',
    fontWeight: 400,
    margin: 0,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  scrollContainer: {
    maxHeight: '480px',
    overflowY: 'auto',
    paddingRight: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  cardPreview: {
    height: '140px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#0f172a',
  },
  cardDate: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '2px 0 0',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
  },
  templateCard: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  templatePreview: {
    height: '140px',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countBadge: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6366f1',
    background: '#eef2ff',
    padding: '3px 10px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  searchInput: {
    padding: '10px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    background: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '0.9rem',
    color: '#0f172a',
    outline: 'none',
    width: '220px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  emptyCard: {
    padding: '60px',
    background: '#fff',
    borderRadius: '16px',
    border: '2px dashed #e2e8f0',
    textAlign: 'center',
    color: '#64748b',
  },
  viewBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #0a5dbbff',
    backgroundColor: 'transparent',
    color: '#0a5dbbff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  slideBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#0a5dbbff',
    backgroundColor: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: 600,
    marginTop: '4px',
  }
};

export default Presentation;