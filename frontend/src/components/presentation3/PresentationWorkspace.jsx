import React, { useState, useEffect } from "react";

import SlidesPanel from "./components/SlidesPanel/SlidesPanel";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import AgentPanel from "./components/AgentPanel/AgentPanel";
import TopBar from "./components/TopBar/TopBar";
import CanvasShell from "./components/Canvas/CanvasShell";
import PresentationMode from "./present/PresentationMode";

import TopProgressBar from "./components/TopProgressBar/TopProgressBar";
import AILoaderOverlay from "./components/AILoaderOverlay/AILoaderOverlay";
import Notifications from "./components/Notifications/Notifications";

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import usePresentationStore from "./store/usePresentationStore";
import { getPresentationById } from "../../services/presentation";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/loading/LoadingSpinner"; // Assuming you have one, or use simple text
import { useAutoSave } from "./hooks/useAutoSave";
import { useUIStore } from "./store/useUIStore";

const PresentationWorkspace = ({ initialData, layout: propLayout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTemplate = searchParams.get("template") === "true";
  const { user } = useAuth();
  const [isPresenting, setIsPresenting] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  // Loading if ID is present and we don't have initialData
  const [isLoading, setIsLoading] = useState(!!id && !initialData);
  const [error, setError] = useState(null);

  const { setPresentation, resetPresentation } = usePresentationStore();
  const hasCloned = React.useRef(false);

  const autoSaveState = useAutoSave();
  const presentationId = usePresentationStore((state) => state.presentationId);

  useEffect(() => {
    if (presentationId) {
      const key = `ppt-${presentationId}-visited`;
      if (!localStorage.getItem(key)) {
        useUIStore.getState().addNotification("Changes are saved automatically. Click Save to save instantly.", "info");
        localStorage.setItem(key, "true");
      }
    }
  }, [presentationId]);

  useEffect(() => {
    if (initialData) {
      console.log("--- Workspace: Using initialData from props:", initialData);
      setPresentation(initialData);
      setIsLoading(false);
    } else if (id) {
      // If template=true, we only want to fetch/clone once for this ID
      if (isTemplate && hasCloned.current) return;

      // Wait for user to be loaded if we are about to clone
      if (!user?._id) return;

      if (isTemplate) hasCloned.current = true;

      setIsLoading(true);
      getPresentationById(id, user?._id, isTemplate)
        .then((data) => {
          console.log("--- Workspace: Fetched data for ID:", id, data);

          // Get the actual presentation ID from the response (could be at root or nested)
          const respId = data.presentationId || (data.data && (data.data._id || data.data.id));

          // Handle Redirect if template=true and backend returns a different presentationId
          if (isTemplate && respId && respId !== id) {
            console.log("--- Workspace: Template cloned, redirecting to:", respId);
            navigate(`/presentation-editor-v3/${respId}?template=false`, { replace: true });
            return;
          }

          // Normalize data if necessary
          const pptData = data.data || data;

          // Ensure title is present and prefers data.title
          pptData.title = data.title || pptData.title || "Untitled Presentation";

          // Ensure ID is present in normalized data
          if (!pptData.presentationId && !pptData.id && !pptData._id) {
            pptData.presentationId = respId || id;
          }

          setPresentation(pptData);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load presentation:", err);
          setError("Failed to load presentation");
          setIsLoading(false);
          // Optional: reset hasCloned if you want to allow retry
          if (isTemplate) hasCloned.current = false;
        });
    } else {
      // New presentation -> Reset store
      console.log("--- Workspace: New presentation, resetting store.");
      resetPresentation();
      setIsLoading(false);
    }
  }, [id, isTemplate, initialData, user?._id, setPresentation, resetPresentation, navigate]);

  if (isLoading) {
    return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading Presentation...</div>;
  }

  if (error) {
    return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "red" }}>{error}</div>;
  }

  if (isPresenting) {
    return <PresentationMode onExit={() => setIsPresenting(false)} />;
  }

  return (
    <>
      <TopProgressBar />
      <AILoaderOverlay />
      <Notifications />
      <div style={styles.root} className="presentation-workspace-root">
        <TopBar
          onPresent={() => setIsPresenting(true)}
          onAgentClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
          autoSaveState={autoSaveState}
        />

        <div style={styles.body}>
          <SlidesPanel />

          <CanvasShell />

          <PropertiesPanel />

          <AgentPanel
            isOpen={isAgentPanelOpen}
            onClose={() => setIsAgentPanelOpen(false)}
          />
        </div>
      </div>
    </>
  );
};
const styles = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  body: {
    flex: 1,
    display: "flex",
    position: "relative",
    overflow: "hidden"
  }
};

export default PresentationWorkspace;
