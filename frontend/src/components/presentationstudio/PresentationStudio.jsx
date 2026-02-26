import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import PromptSection from './PromptSection';
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
  const [mediaStyle, setMediaStyle] = useState(null);
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

  // Transform backend response to OutlineEditor format
  const transformOutlineResponse = (apiResponse) => {
    if (!apiResponse || !apiResponse.data || !apiResponse.data.slides) {
      return null;
    }

    const transformedSlides = apiResponse.data.slides.map((slide, index) => {
      let content = { mode: 'raw', rawText: '' };

      // Transform content based on contentType
      if (slide.contentType === 'paragraph') {
        content = { mode: 'raw', rawText: typeof slide.content === 'string' ? slide.content : String(slide.content || '') };
      } else if (slide.contentType === 'bullets') {
        if (Array.isArray(slide.content)) {
          content = {
            mode: 'bullets',
            bullets: slide.content
          };
        } else if (typeof slide.content === 'string') {
          // Convert string to array of bullets
          content = {
            mode: 'bullets',
            bullets: slide.content.split('\n').filter(line => line.trim())
          };
        } else {
          content = { mode: 'raw', rawText: String(slide.content || '') };
        }
      } else if (slide.contentType === 'comparison') {
        if (typeof slide.content === 'object' && slide.content !== null && !Array.isArray(slide.content)) {
          content = {
            mode: 'comparison',
            left: Array.isArray(slide.content.left) ? slide.content.left : [],
            right: Array.isArray(slide.content.right) ? slide.content.right : []
          };
        } else {
          content = { mode: 'raw', rawText: String(slide.content || '') };
        }
      } else {
        // Fallback: try to determine content type from content structure
        if (typeof slide.content === 'string') {
          content = { mode: 'raw', rawText: slide.content };
        } else if (Array.isArray(slide.content)) {
          content = { mode: 'bullets', bullets: slide.content };
        } else if (typeof slide.content === 'object' && slide.content !== null) {
          if (slide.content.left && slide.content.right) {
            content = {
              mode: 'comparison',
              left: Array.isArray(slide.content.left) ? slide.content.left : [],
              right: Array.isArray(slide.content.right) ? slide.content.right : []
            };
          } else {
            content = { mode: 'raw', rawText: JSON.stringify(slide.content) };
          }
        }
      }

      return {
        slideId: `slide-${slide.slideNo || index + 1}`,
        slideNo: slide.slideNo || index + 1,
        source: 'ai',
        title: slide.title || '',
        content: content,
        layout: slide.layout || 'content',
        contentType: slide.contentType || 'paragraph'
      };
    });

    return {
      presentationId: apiResponse.presentationId,
      meta: apiResponse.data.meta || {},
      topic: apiResponse.data.meta?.topic || prompt,
      tone: apiResponse.data.meta?.tone || tone,
      length: apiResponse.data.meta?.slideCount || length,
      mediaStyle: mediaStyle,
      slides: transformedSlides
    };
  };
  const startFakeProgress = () => {
    return new Promise(resolve => {
      let current = 0;

      const interval = setInterval(() => {
        current += Math.random() * 7;

        if (current >= 95) {
          current = 95;
          clearInterval(interval);
          resolve();
        }

        setProgress(Math.floor(current));
      }, 350);
    });
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
  const handleGenerateOutline = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {

      // start both together
      const progressPromise = startFakeProgress();

      const apiPromise = generateOutline({
        topic: prompt,
        tone: tone?.toLowerCase(),
        length: parseInt(length),
        mediaStyle: mediaStyle,
        outlineText: outlineText
      });

      // wait until loader reaches 95
      await progressPromise;

      // wait api (if not completed yet)
      const response = await apiPromise;

      // now finish 95 → 100 instantly smooth
      await finishProgress();

      const transformedOutline = transformOutlineResponse(response);

      if (!transformedOutline) throw new Error('Invalid response format from server');

      // 🔥 EXACT moment loader hits 100 → screen change
      setOutlineData(transformedOutline);

    } catch (error) {
      setError(error.message || 'Failed to generate outline. Please try again.');
    } finally {
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
    setMediaStyle(null);
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
          onBack={() => navigate('/presentation')}
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
          mediaStyle={mediaStyle}
          setMediaStyle={setMediaStyle}
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
    <div className="presentation-studio">
      <div className="presentation-studio-container">


        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default PresentationStudio;