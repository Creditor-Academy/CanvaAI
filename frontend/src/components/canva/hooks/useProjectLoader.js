import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { getImageById } from '../../../services/imageEditor/imageApi';

const normalizePrefillProject = (rawProject) => {
  if (!rawProject || typeof rawProject !== 'object') return null;

  if (rawProject.data && typeof rawProject.data === 'object') {
    return rawProject;
  }

  if (rawProject.layer || rawProject.layers || rawProject.canvasSize) {
    return {
      title: rawProject.title,
      data: {
        layer: rawProject.layer || rawProject.layers || [],
        canvasSize: rawProject.canvasSize,
        canvasBgColor: rawProject.canvasBgColor,
        canvasBgImage: rawProject.canvasBgImage,
        zoom: rawProject.zoom,
        pan: rawProject.pan,
      },
    };
  }

  return null;
};

/**
 * Custom hook for loading project data
 */
export const useProjectLoader = (
  setLayers,
  setCanvasSize,
  setZoom,
  setPan,
  setCanvasBgColor,
  setCanvasBgImage,
  setProjectName
) => {
  const { id: projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      let shouldLoadFromApi = true;
      let isCloneImportFlow = false;

      try {
        isCloneImportFlow = !!sessionStorage.getItem(`prefill_import_flag_${projectId}`);
      } catch (e) {
        isCloneImportFlow = false;
      }

      // If a prefill payload was stored (from template/admin), use it first
      try {
        const key = `prefill_project_${projectId}`
        const raw = sessionStorage.getItem(key)
        if (raw) {
          const parsedProject = JSON.parse(raw)
          const imageProject = normalizePrefillProject(parsedProject)
          const layers = imageProject?.data?.layer || []

          if (!imageProject) {
            console.warn('Invalid prefill project payload, falling back to API load')
          } else {
            setLayers(layers)
            if (imageProject.title) setProjectName(imageProject.title)
            if (imageProject.data?.canvasSize) {
              setCanvasSize(imageProject.data.canvasSize)
              setZoom(imageProject.data.zoom || 80)
              setPan(imageProject.data.pan || { x: 0, y: 0 })
            }
            setCanvasBgColor(imageProject.data?.canvasBgColor || '#ffffff')
            setCanvasBgImage(imageProject.data?.canvasBgImage || null)
            // remove the prefill so it doesn't persist
            sessionStorage.removeItem(key)
            // remove the import flag if present
            try { sessionStorage.removeItem(`prefill_import_flag_${projectId}`) } catch (e) { }
            shouldLoadFromApi = true
          }
        }
      } catch (err) {
        console.warn('Failed to apply prefill project from sessionStorage', err)
      }

      const loadData = async () => {
        if (!isCloneImportFlow) {
          try {
            // Try loading from regular project API first for non-import flow
            const project = await api.getProject(projectId);
            if (project && project.design) {
              setLayers(project.design.layers || []);
              setCanvasSize(project.design.canvasSize || { width: 800, height: 600 });
              setZoom(project.design.zoom || 100);
              setPan(project.design.pan || { x: 0, y: 0 });
              if (project.design.canvasBgColor) setCanvasBgColor(project.design.canvasBgColor);
              if (project.design.canvasBgImage) setCanvasBgImage(project.design.canvasBgImage);
              if (project.title) setProjectName(project.title);
              return;
            }
          } catch (error) {
            console.log("Project not found in regular projects, trying images API...");
          }
        }

        try {
          // If project API fails or doesn't have design, try image API
          const imageProject = await getImageById(projectId);
          if (imageProject && imageProject.data) {
            const layers = imageProject.data.layer || [];
            setLayers(layers);
            if (imageProject.title) setProjectName(imageProject.title);
            // If the image payload contains an explicit canvasSize, use it directly
            if (imageProject.data.canvasSize && imageProject.data.canvasSize.width && imageProject.data.canvasSize.height) {
              setCanvasSize(imageProject.data.canvasSize);
              // Use stored zoom/pan if present, otherwise sensible defaults
              setZoom(imageProject.data.zoom || 80);
              setPan(imageProject.data.pan || { x: 0, y: 0 });
            } else {
              // Calculate canvas size from layers when explicit canvasSize isn't available
              let maxWidth = 800;
              let maxHeight = 600;

              layers.forEach(l => {
                const right = (l.x || 0) + (l.width || 0);
                const bottom = (l.y || 0) + (l.height || 0);
                if (right > maxWidth) maxWidth = right;
                if (bottom > maxHeight) maxHeight = bottom;
              });

              // Add some padding and round to nearest 10
              maxWidth = Math.ceil((maxWidth + 20) / 10) * 10;
              maxHeight = Math.ceil((maxHeight + 20) / 10) * 10;

              setCanvasSize({ width: maxWidth, height: maxHeight });
              setZoom(80);
              setPan({ x: 0, y: 0 });
            }
            // Determine and apply canvas background (image or color) from layer metadata
            try {
              const layerWithBgImage = layers.find(l => l.canvasBgImage && (l.canvasBgColor === 'transparent' || l.canvasBgColor === 'rgba(0,0,0,0)' || !l.canvasBgColor));
              if (layerWithBgImage) {
                if (setCanvasBgImage) setCanvasBgImage(layerWithBgImage.canvasBgImage);
                if (setCanvasBgColor) setCanvasBgColor(layerWithBgImage.canvasBgColor || 'transparent');
              } else {
                // Prefer a non-transparent bg color if present
                const layerWithBgColor = layers.find(l => l.canvasBgColor && l.canvasBgColor !== 'transparent' && l.canvasBgColor !== 'rgba(0,0,0,0)');
                if (layerWithBgColor) {
                  if (setCanvasBgColor) setCanvasBgColor(layerWithBgColor.canvasBgColor);
                } else if (layers[0]) {
                  // Fallback to first layer's bg settings if available
                  if (setCanvasBgImage) setCanvasBgImage(layers[0].canvasBgImage || null);
                  if (setCanvasBgColor) setCanvasBgColor(layers[0].canvasBgColor || '#ffffff');
                }

                // If individual layers carry zoom/pan/canvasSize metadata, apply a sample
                const sample = layers[0];
                if (sample) {
                  if (sample.zoom && setZoom) setZoom(sample.zoom);
                  if (sample.pan && setPan) setPan(sample.pan);
                  if (sample.canvasSize && setCanvasSize) setCanvasSize(sample.canvasSize);
                }
              }
            } catch (err) {
              console.warn('Error applying canvas background from imageProject', err);
            }
          }
        } catch (error) {
          console.error("Failed to load project from both APIs", error);
        }
      };

      if (shouldLoadFromApi) {
        loadData();
      }
    }
  }, [projectId, setLayers, setCanvasSize, setZoom, setPan, setCanvasBgColor, setCanvasBgImage, setProjectName]);
};
