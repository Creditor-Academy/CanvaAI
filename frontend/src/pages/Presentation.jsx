import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMonitor, FiMaximize, FiZap, FiPlus, FiFileText } from 'react-icons/fi';
import { Trash2 } from 'lucide-react';
import { PresentationWorkspace } from '../components/presentation';
import PresentationStudio from '../components/presentationstudio/PresentationStudio';
import { PRESENTATION_LAYOUTS } from '../components/presentation/layout/layouts';
import { useAuth } from '../contexts/AuthContext';
import { listPresentations, deletePresentation } from '../services/presentation';

const Presentation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const res = await listPresentations(user._id);
        // Assuming API returns { status: "success", data: [...] } or just [...]
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this presentation?")) return;
    try {
      await deletePresentation(id, user._id);
      setPresentations(prev => prev.filter(ppt => ppt._id !== id));
    } catch (error) {
      console.error("Failed to delete presentation:", error);
      alert("Failed to delete presentation.");
    }
  };

  // Open new editor in new tab
  const openNewEditor = () => {
    window.open('/presentation-editor', '_blank');
  };

  // Open presentation editor v3 in new tab
  const openPresentationEditorV3 = () => {
    window.open('/presentation-editor-v3', '_blank');
  };

  const ICON_MAP = {
    desktop: <FiMonitor size={22} />,
    classic: <FiMaximize size={22} />,
  };

  // If AI Studio is active, show it


  // If layout is selected, show workspace
  if (selectedLayout) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
        <PresentationWorkspace
          layout={selectedLayout}
          onBack={() => setSelectedLayout(null)}
        />
      </div>
    );
  }

  // Show layout picker with AI button
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          width: '100%',
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '48px 24px 64px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(15, 23, 42, 0.08)',
              color: '#111827',
              fontWeight: 600,
              fontSize: '0.95rem',
              marginBottom: '18px',
            }}
          >
            🎯 Choose your canvas
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 3.6vw, 2.85rem)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
            }}
          >
            Start a beautiful presentation
          </h1>
          <p
            style={{
              margin: '14px 0 0',
              maxWidth: '640px',
              fontSize: '1.05rem',
              color: '#475569',
              lineHeight: 1.6,
            }}
          >
            Pick a layout that fits your story, or let AI create a stunning presentation for you.
          </p>

          <button
            onClick={openNewEditor}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🚀 Open New Editor (Full Screen)
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '22px',
            width: '100%',
          }}
        >
          {/* Card 1: 16:9 - Default internal editor logic */}
          <div
            onClick={() => setSelectedLayout(PRESENTATION_LAYOUTS.find(l => l.id === '16-9'))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '28px 26px',
              borderRadius: '24px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: '#ffffff',
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
              position: 'relative',
              isolation: 'isolate',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 18px 48px rgba(15, 23, 42, 0.08)';
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '0',
                background: `linear-gradient(135deg, #6366f122, transparent 65%)`,
                zIndex: -1,
              }}
            />
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: `#6366f115`,
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiMonitor size={22} />
            </div>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: `#6366f11A`,
                  color: '#6366f1',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '10px',
                }}
              >
                16:9
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.25,
                }}
              >
                Widescreen 16:9
              </h2>
            </div>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '0.98rem',
                color: '#475569',
                lineHeight: 1.55,
              }}
            >
              Perfect for desktops, projectors, and modern displays.
            </p>
            <div
              style={{
                marginTop: 'auto',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              <span style={{ opacity: 0.72 }}>
                1920 × 1080px
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/ai-presentation');
                }}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <FiZap size={16} />
                Create
              </button>

            </div>
          </div>

          {/* Card 2: New Presentation (was 4:3) - Opens v3 editor */}
          <div
            onClick={openPresentationEditorV3}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '28px 26px',
              borderRadius: '24px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: '#ffffff',
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
              position: 'relative',
              isolation: 'isolate',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 18px 48px rgba(15, 23, 42, 0.08)';
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '0',
                background: `linear-gradient(135deg, #10b98122, transparent 65%)`,
                zIndex: -1,
              }}
            />
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: `#10b98115`,
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiPlus size={28} />
            </div>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: `#10b9811A`,
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '10px',
                }}
              >
                New Presentation
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.25,
                }}
              >
                Start Fresh
              </h2>
            </div>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '0.98rem',
                color: '#475569',
                lineHeight: 1.55,
              }}
            >
              Create a new presentation from scratch using our advanced editor.
            </p>
            <div
              style={{
                marginTop: 'auto',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              <span style={{ opacity: 0.72 }}>
                Universal
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                }}
              >
                Open Editor
              </span>
            </div>
          </div>

          {/* AI Button Card */}
          <div
            onClick={() => navigate('/ai-presentation')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '28px 26px',
              borderRadius: '24px',
              border: '2px dashed rgba(251, 191, 36, 0.3)',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.08))',
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
              position: 'relative',
              isolation: 'isolate',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 24px 60px rgba(251, 191, 36, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 18px 48px rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiZap size={28} />
            </div>

            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#f59e0b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '10px',
                }}
              >
                AI Powered
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.25,
                }}
              >
                Create with AI
              </h2>
            </div>

            <p
              style={{
                margin: '6px 0 0',
                fontSize: '0.98rem',
                color: '#475569',
                lineHeight: 1.55,
              }}
            >
              Let AI generate a complete presentation from your topic. Just describe what you need and watch it come to life.
            </p>

            <div
              style={{
                marginTop: 'auto',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                fontWeight: 600,
                color: '#f59e0b',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiZap size={16} />
                Create with AI
              </span>
            </div>
          </div>
        </div>

        {/* Previous Work Section */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Previous Work</h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading...</div>
          ) : presentations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", backgroundColor: "#ffffff", borderRadius: "12px", border: "2px dashed #e5e7eb" }}>
              <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>No presentations found. Create your first one!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {presentations.map((ppt) => (
                <div
                  key={ppt._id}
                  onClick={() => window.open(`/presentation-editor-v3/${ppt._id}`, '_blank')}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    overflow: "hidden",
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                  }}
                >
                  <div style={{ height: "160px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #f0f0f0" }}>
                    <FiFileText size={48} color="#9ca3af" />
                  </div>

                  <div style={{ padding: "16px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: "600", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ppt.title || "Untitled Presentation"}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                        Edited {new Date(ppt.updatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(ppt._id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Delete Presentation"
                    >
                      <Trash2 size={18} />
                    </button>
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

export default Presentation;

