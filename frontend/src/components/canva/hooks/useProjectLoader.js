import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { getImageById } from '../../../services/imageEditor/imageApi';

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
      const loadData = async () => {
        try {
          // Try loading from regular project API first
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

        try {
          // If project API fails or doesn't have design, try image API
          const imageProject = await getImageById(projectId);
          if (imageProject && imageProject.data) {
            const layers = imageProject.data.layer || [];
            setLayers(layers);
            if (imageProject.title) setProjectName(imageProject.title);

            // Calculate canvas size from layers
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
        } catch (error) {
          console.error("Failed to load project from both APIs", error);
        }
      };

      loadData();
    }
  }, [projectId, setLayers, setCanvasSize, setZoom, setPan, setCanvasBgColor, setCanvasBgImage, setProjectName]);
};
