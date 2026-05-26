import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import PromptSection from './PromptSection';
import usePresentationFormStore from './usePresentationFormStore';
import OutlineEditor from './OutlineEditor';
import { PresentationWorkspace } from '../presentation';
import { generateOutline } from '../../services/PresentationStudioService';
import './styles/PresentationStudio.css';

const PresentationStudio = ({ onBack }) => {
  const navigate = useNavigate();

  // Form data (Step 1: Input)
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState(null);
  const [length, setLength] = useState(null);
  const [useBrandStyle, setUseBrandStyle] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outlineText, setOutlineText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);



  // Step 2: Outline data
  const [outlineData, setOutlineData] = useState(null);

  // Step 3: Final presentation data
  const [finalPresentationData, setFinalPresentationData] = useState(null);

  // Error state
  const [error, setError] = useState(null);
  const [showBalancePopup, setShowBalancePopup] = useState(false);
  const [balancePopupMessage, setBalancePopupMessage] = useState('');

  const normalizeBulletText = (bullet) => {
    if (bullet == null) return '';
    if (typeof bullet === 'string') return bullet;
    if (typeof bullet === 'object') {
      if (typeof bullet.text === 'string' && bullet.text.trim()) return bullet.text;
      if (typeof bullet.title === 'string' && bullet.title.trim()) return bullet.title;
      if (typeof bullet.label === 'string' && bullet.label.trim()) return bullet.label;
      const composed = [bullet.text, bullet.why, bullet.soWhat]
        .filter(Boolean)
        .map(String)
        .join('\n\n')
        .trim();
      if (composed) return composed;
      return JSON.stringify(bullet);
    }
    return String(bullet);
  };

  const normalizeBulletArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items
      .map(normalizeBulletText)
      .filter((item) => item && item.trim().length > 0);
  };

  // Transform backend response to OutlineEditor format
  const transformOutlineResponse = (apiResponse) => {
    const responseBody = apiResponse?.data || apiResponse;
    if (!responseBody || !responseBody.slides) {
      return null;
    }

    const transformedSlides = responseBody.slides.map((slide, index) => {
      const rawContent = slide.content;
      const slideBullets = normalizeBulletArray(slide.bullets || []);
      let content = { mode: 'raw', rawText: '' };

      const extractRawText = (value) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null) {
          if (typeof value.rawText === 'string') return value.rawText;
          if (value.text || value.why || value.soWhat) return normalizeBulletText(value);
          return JSON.stringify(value);
        }
        return String(value || '');
      };

      if (typeof rawContent === 'object' && rawContent !== null) {
        if (rawContent.mode === 'raw') {
          content = {
            mode: 'raw',
            rawText: extractRawText(rawContent)
          };
        } else if (rawContent.mode === 'bullets') {
          content = {
            mode: 'bullets',
            bullets: normalizeBulletArray(rawContent.bullets || slideBullets)
          };
        } else if (rawContent.mode === 'comparison') {
          content = {
            mode: 'comparison',
            left: normalizeBulletArray(rawContent.left),
            right: normalizeBulletArray(rawContent.right)
          };
        } else if (Array.isArray(rawContent.bullets)) {
          content = {
            mode: 'bullets',
            bullets: normalizeBulletArray(rawContent.bullets)
          };
        } else if (rawContent.text || rawContent.why || rawContent.soWhat) {
          content = {
            mode: 'raw',
            rawText: normalizeBulletText(rawContent)
          };
        } else {
          content = {
            mode: 'raw',
            rawText: extractRawText(rawContent)
          };
        }
      } else if (Array.isArray(rawContent)) {
        content = {
          mode: 'bullets',
          bullets: normalizeBulletArray(rawContent)
        };
      } else if (typeof rawContent === 'string') {
        content = {
          mode: 'raw',
          rawText: rawContent
        };
      }

      const bullets = content.mode === 'bullets' ? content.bullets : slideBullets;

      return {
        bullets,
        slideId: `slide-${slide.slideNo || index + 1}`,
        slideNo: slide.slideNo || index + 1,
        source: slide.source || 'ai',
        title: slide.title || '',
        content,
        layout: slide.layout || 'content',
        contentType: slide.contentType || (content.mode === 'bullets' ? 'bullets' : 'paragraph')
      };
    });

    return {
      presentationId: responseBody.presentationId,
      meta: responseBody.meta || {},
      topic: responseBody.topic || responseBody.meta?.topic || prompt,
      tone: responseBody.tone || responseBody.meta?.tone || tone,
      length: responseBody.length || responseBody.meta?.slideCount || length,
      mediaStyle: responseBody.mediaStyle || responseBody.meta?.media?.style || 'realistic',
      slides: transformedSlides
    };
  };
  const startFakeProgress = () => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 10;
      if (current >= 92) current = 92;
      setProgress(Math.floor(current));
    }, 200);

    return () => clearInterval(interval);
  };


  const finishProgress = () => {
    return new Promise(resolve => {
      let current = 95;

      const interval = setInterval(() => {
        current += 1.5;

        if (current >= 100) {
          current = 100;
          clearInterval(interval);
          resolve();
        }

        setProgress(Math.floor(current));
      }, 20);
    });
  };




  // Step 1: Generate Outline
  const handleGenerateOutline = async (payload) => {
    if (!payload?.topic?.trim()) return;

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    // Capture the exact meta object before the API call
    const capturedMeta = payload.meta || null;

    let stopFakeProgress = null;
    try {
      stopFakeProgress = startFakeProgress();
      const response = await generateOutline(payload);
      stopFakeProgress?.();
      stopFakeProgress = null;
      await finishProgress();


      const transformedOutline = transformOutlineResponse(response);

      if (!transformedOutline) throw new Error('Invalid response format from server');

      // Wait 1 second after 100% success before moving to Step 2
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔥 EXACT moment loader hits 100 → screen change
      // Embed originalMeta so OutlineEditor forwards it unchanged to finalize-ppt
      setOutlineData({
        ...transformedOutline,
        meta: response?.data?.meta || capturedMeta || {},
        originalMeta: capturedMeta,
      });

    } catch (error) {
      stopFakeProgress?.();

      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message || error?.message;

      if (status === 403 && backendMessage === 'Not enough Balance') {
        setShowBalancePopup(true);
        setBalancePopupMessage(
          'Not enough balance to generate outline. Please renew your plan or add more credits.'
        );
        setError(null);
        setProgress(0);
        return;
      }

      setError(backendMessage || 'Failed to generate outline. Please try again.');
    } finally {
      stopFakeProgress?.();
      setIsGenerating(false);
    }
  };




  // Step 3: Handle final presentation from OutlineEditor
  const handleFinalize = (finalPresentation) => {
    setFinalPresentationData(finalPresentation);
  };

  // Reset to start over
  const handleResetAll = () => {
    setOutlineData(null);
    setFinalPresentationData(null);
    setPrompt('');
    setTone(null);
    setLength(null);
    usePresentationFormStore.getState().resetForm();
    setUseBrandStyle(false);
    setOutlineText('');
    setError(null);
    setProgress(0);
  };

  // back from outline → prompt (keep filled data)
  const handleBackToPrompt = () => {
    setOutlineData(null);
    setFinalPresentationData(null);
  };

  // back from workspace → outline
  const handleBackToOutline = () => {
    setFinalPresentationData(null);
  };


  // Determine which step to show
  const renderCurrentStep = () => {
    // Step 3: Final Presentation Workspace
    if (finalPresentationData) {
      const layout = { width: 1920, height: 1080 };
      return (
        <>
          <Header
            onBack={handleBackToOutline}
            title="Presentation Editor"
            subtitle="Design and customize your slides"
          />

          <PresentationWorkspace
            layout={layout}
            initialData={finalPresentationData}
            onBack={handleResetAll}
          />
        </>
      );
    }


    // Step 2: Outline Editor
    if (outlineData) {
      return (
        <>
          <Header
            onBack={handleBackToPrompt}
            title="Edit Outline"
            subtitle="Review and edit your presentation outline. You can modify titles and content."
          />

          <OutlineEditor
            outlineData={outlineData}
            onFinalize={handleFinalize}
          />
        </>
      );
    }


    // Step 1: Presentation Studio (Input)
    return (
      <>
        <Header
          onBack={() => navigate('/dashboard/presentation')}
          title="AI Presentation Studio"
          subtitle="Create stunning presentations with AI in seconds"
        />

        <PromptSection
          prompt={prompt}
          setPrompt={setPrompt}
          tone={tone}
          setTone={setTone}
          length={length}
          setLength={setLength}
          useBrandStyle={useBrandStyle}
          setUseBrandStyle={setUseBrandStyle}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          outlineText={outlineText}
          setOutlineText={setOutlineText}
          handleGenerate={handleGenerateOutline}
          isGenerating={isGenerating}
          generationStep={progress}
        />

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="">
      <div className="presentation-studio-container">
        {renderCurrentStep()}

        {showBalancePopup && (
          <div className="balance-popup-overlay">
            <div className="balance-popup">
              <div className="balance-popup-icon">⚠️</div>
              <h3>Insufficient Balance</h3>
              <p>{balancePopupMessage}</p>
              <div className="balance-popup-actions">
                <button
                  className="balance-popup-secondary"
                  onClick={() => setShowBalancePopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="balance-popup-primary"
                  onClick={() => {
                    setShowBalancePopup(false);
                    navigate('/dashboard/pricing');
                  }}
                >
                  Renew Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationStudio;