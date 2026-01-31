import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMonitor, FiMaximize, FiZap } from 'react-icons/fi';
import { PresentationWorkspace } from '../components/presentation';
import PresentationStudio from '../components/presentationstudio/PresentationStudio';
import { PRESENTATION_LAYOUTS } from '../components/presentation/layout/layouts';

const Presentation = () => {
  const navigate = useNavigate();
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [showAIStudio, setShowAIStudio] = useState(false);

  // Open new editor in new tab
  const openNewEditor = () => {
    window.open('/presentation-editor', '_blank');
  };

  // Open presentation editor v3 in new tab
  const openPresentationEditorV3 = () => {
    window.open('/presentation-editor-v3', '_blank');
  };

  // Filter layouts to only show 16:9 and 4:3
  const availableLayouts = PRESENTATION_LAYOUTS.filter(layout => 
    layout.id === '16-9' || layout.id === '4-3'
  );

  const ICON_MAP = {
    desktop: <FiMonitor size={22} />,
    classic: <FiMaximize size={22} />,
  };

  // If AI Studio is active, show it
  if (showAIStudio) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <PresentationStudio onBack={() => setShowAIStudio(false)} />
      </div>
    );
  }

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
          {/* New Editor Button */}
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
          {/* Presentation Editor V3 Button */}
          <button
            onClick={openPresentationEditorV3}
            style={{
              marginTop: '20px',
              marginLeft: '12px',
              padding: '12px 24px',
              background: '#10b981',
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
            🎨 Open Presentation Editor V3
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
          {availableLayouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => setSelectedLayout(layout)}
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
                  background: `linear-gradient(135deg, ${layout.accent}22, transparent 65%)`,
                  zIndex: -1,
                }}
              />

              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: `${layout.accent}15`,
                  color: layout.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ICON_MAP[layout.icon]}
              </div>

              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: `${layout.accent}1A`,
                    color: layout.accent,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: '10px',
                  }}
                >
                  {layout.aspectLabel}
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
                  {layout.name}
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
                {layout.description}
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
                  {layout.width} × {layout.height}px
                </span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    lineHeight: 1,
                  }}
                >
                  Use layout
                </span>
              </div>
            </button>
          ))}

          {/* AI Button Card */}
          <button
            onClick={() => setShowAIStudio(true)}
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default Presentation;

