import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiPlus, FiFileText, FiLayout, FiClock } from 'react-icons/fi';
import { Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listPresentations, deletePresentation, getAdminTemplates, savePresentation } from '../services/presentation';

const Presentation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [presentations, setPresentations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // Inject spin animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
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
        setPresentations(list);
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

  const handleUseTemplate = async (template) => {
    if (isCloning) return;
    setIsCloning(true);
    try {
      // Clone implementation: Save a new presentation for the user using template data
      const payload = {
        userId: user?._id,
        title: `${template.title} (Copy)`,
        data: template.data // Assuming template.data contains { slides: [...] }
      };

      const res = await savePresentation(payload);
      const newId = res.presentationId || res._id || res.id || (res.data && (res.data._id || res.data.id));

      if (newId) {
        navigate(`/presentation-editor-v3/${newId}`);
      } else {
        alert("Failed to create presentation from template.");
      }
    } catch (error) {
      console.error("Error cloning template:", error);
      alert("Failed to use template.");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header Section */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Presentation Hub</h1>
            <p style={styles.subtitle}>Create professional presentations in seconds with AI or start from scratch.</p>
          </div>
        </div>

        {/* Primary Actions */}
        <div style={styles.actionGrid}>
          {/* Create with AI */}
          <div
            onClick={() => navigate('/ai-presentation')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            style={{ ...styles.actionCard, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
          >
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

          {/* Create Fresh */}
          <div
            onClick={() => navigate('/presentation-editor-v3')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            style={{ ...styles.actionCard, background: '#fff', border: '1px solid #e2e8f0' }}
          >
            <div style={{ ...styles.iconContainer, background: '#f0fdf4' }}>
              <FiPlus size={32} color="#22c55e" />
            </div>
            <div>
              <h2 style={styles.actionTitle}>Create Fresh</h2>
              <p style={styles.actionDesc}>
                Open our advanced editor and start your story from scratch.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Work Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <FiClock size={20} />
            <h2 style={styles.sectionTitle}>Recent Presentations</h2>
          </div>

          <div style={styles.scrollContainer}>
            {loading ? (
              <div style={styles.emptyState}>Loading your work...</div>
            ) : presentations.length === 0 ? (
              <div style={styles.emptyCard}>
                <p>No presentations yet. Start creating!</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {presentations.map((ppt) => (
                  <div
                    key={ppt._id}
                    onClick={() => navigate(`/presentation-editor-v3/${ppt._id}`)}
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
                      <FiFileText size={40} color="#94a3b8" />
                    </div>
                    <div style={styles.cardInfo}>
                      <div style={styles.cardText}>
                        <h3 style={styles.cardTitle}>{ppt.title || "Untitled"}</h3>
                        <p style={styles.cardDate}>{new Date(ppt.updatedAt).toLocaleDateString()}</p>
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

        {/* Templates Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <FiLayout size={20} />
            <h2 style={styles.sectionTitle}>Featured Templates</h2>
          </div>

          {templatesLoading ? (
            <div style={styles.emptyState}>Loading templates...</div>
          ) : (
            <div style={styles.grid}>
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  onClick={() => handleUseTemplate(tpl)}
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
                    <FiLayout size={40} color="#6366f1" />
                    <div style={styles.templateBadge}>Template</div>
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardText}>
                      <h3 style={styles.cardTitle}>{tpl.title}</h3>
                      <p style={styles.templateAuthor}>Designed by Admin</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '40px 20px',
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
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
    marginTop: '8px',
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
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    }
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
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
  },
  actionDesc: {
    fontSize: '1rem',
    margin: '4px 0 0',
  },
  zapIcon: {
    position: 'absolute',
    right: '-10px',
    bottom: '-10px',
    opacity: 0.5,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
  },
  scrollContainer: {
    maxHeight: '480px', // Approx 2 rows
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
    transition: 'transform 0.2s',
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
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#0f172a',
  },
  cardDate: {
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
    ':hover': {
      background: '#fee2e2',
    }
  },
  templateCard: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  templatePreview: {
    height: '140px',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  templateBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#6366f1',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
  },
  templateAuthor: {
    fontSize: '0.85rem',
    color: '#6366f1',
    margin: '2px 0 0',
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
  },
  emptyCard: {
    padding: '60px',
    background: '#fff',
    borderRadius: '16px',
    border: '2px dashed #e2e8f0',
    textAlign: 'center',
    color: '#64748b',
  }
};

export default Presentation;