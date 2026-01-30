import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

/**
 * Custom hook for loading project data
 */
export const useProjectLoader = (
  setLayers,
  setCanvasSize,
  setZoom,
  setPan
) => {
  const { id: projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      api.getProject(projectId)
        .then(project => {
          if (project && project.design) {
            setLayers(project.design.layers || []);
            setCanvasSize(project.design.canvasSize || { width: 800, height: 600 });
            setZoom(project.design.zoom || 100);
            setPan(project.design.pan || { x: 0, y: 0 });
          }
        })
        .catch(error => {
          console.error("Failed to load project", error);
        });
    }
  }, [projectId, setLayers, setCanvasSize, setZoom, setPan]);
};
