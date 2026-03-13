import React, { useState } from 'react';
import { FiZap } from 'react-icons/fi';
import { generateImage } from '@/services/imageEditor/imageApi';
import { useAuth } from '@/contexts/AuthContext';

const AIImageGenerator = ({
  onImageGenerated,
  hoveredOption,
  setHoveredOption,
  imageSettings
}) => {
  const { user } = useAuth();
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('realistic');

  const handleAIGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      setErrorMessage('Please enter a prompt to generate an image');
      return;
    }

    setIsGeneratingAI(true);
    setErrorMessage('');

    try {
      setIsGeneratingAI(true);
      setErrorMessage('');

      const userId = user?._id || user?.id;
      const imageId = Date.now().toString();
      const data = await generateImage(userId, imageId, aiPrompt, selectedFilter);

      let respItem = null;
      if (Array.isArray(data) && data.length > 0) respItem = data[0];
      else if (data && Array.isArray(data.data) && data.data.length > 0) respItem = data.data[0];
      else if (data && (data.url || data.imageUrl)) respItem = data;
      else respItem = {};

      const imageUrl = respItem.url || respItem.imageUrl;
      if (!imageUrl) {
        console.error('AI generate returned unexpected response:', data);
        throw new Error('Invalid image data received from server: missing url');
      }

      const imgSrc = imageUrl;

      // Create a new image object (wait to add until URL is confirmed loadable)

      const newImage = {
        id: imageId,
        type: 'image',
        name: `AI Generated: ${aiPrompt.substring(0, 20)}...`,
        filter: selectedFilter,
        src: imgSrc,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        visible: true,
        locked: false,
        rotation: 0,
        ...imageSettings
      };

      try {
        await new Promise((resolve, reject) => {
          const probe = new Image();

          probe.onload = () => resolve();
          probe.onerror = (e) => reject(new Error('Failed to load generated image URL: ' + (e?.message || 'error')));
          probe.src = imgSrc;
          if (probe.complete) resolve();
        });

        if (onImageGenerated) onImageGenerated(newImage);
        setAiPrompt('');
        setErrorMessage('');
      } catch (err) {
        console.error('Generated image failed to load:', err);
        setErrorMessage('Generated image not accessible (CORS or missing file).');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      if (!errorMessage) {
        setErrorMessage(error.message || 'Failed to generate image. Please try again.');
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="mt-3 w-full">
      <input
        type="text"
        placeholder="Enter prompt for AI image..."
        value={aiPrompt}
        onChange={(e) => {
          setAiPrompt(e.target.value);
          if (errorMessage) setErrorMessage('');
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !isGeneratingAI) {
            handleAIGenerateImage();
          }
        }}
        className={`w-full mb-4 px-3 py-2.5 rounded-lg text-sm text-white bg-slate-800 outline-none box-border transition-colors ${errorMessage
          ? 'border border-red-500 focus:border-red-500'
          : 'border border-slate-600 focus:border-purple-500'
          } ${isGeneratingAI ? 'opacity-60 cursor-not-allowed' : ''}`}
        disabled={isGeneratingAI}
      />
      <div className="mb-3">
        <label className="text-xs text-slate-300 mb-1 block">Image Style</label>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm text-white bg-slate-800 border border-slate-600 outline-none"
          disabled={isGeneratingAI}
        >
          <option value="realistic">Realistic</option>
          <option value="anime">Anime</option>
          <option value="cartoon">Cartoon</option>
          <option value="sketch">Sketch</option>
          <option value="painting">Painting</option>
        </select>
      </div>
      {errorMessage && (
        <div className="p-2 mb-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-xs leading-relaxed">
          {errorMessage}
        </div>
      )}
      <button
        className={`py-5 px-4 border-2 border-dashed border-purple-500 rounded-xl w-full flex flex-col items-center justify-center gap-2.5 text-sm font-semibold text-white transition-all duration-300 min-h-[90px] ${hoveredOption === 'generate-ai' && !isGeneratingAI
          ? 'bg-gradient-to-r from-purple-700 to-blue-600 border-purple-400'
          : 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-md shadow-purple-600/30 border-purple-500'
          } ${isGeneratingAI
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:shadow-xl'
          }`}
        onMouseEnter={() => !isGeneratingAI && setHoveredOption('generate-ai')}
        onMouseLeave={() => setHoveredOption(null)}
        onClick={handleAIGenerateImage}
        disabled={isGeneratingAI}
      >
        <FiZap size={20} className="text-white" />
        <span className="text-white text-xs font-semibold text-center leading-tight">
          {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
        </span>
      </button>
    </div>
  );
};

export default AIImageGenerator;


