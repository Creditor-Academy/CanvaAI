import React, { useState, useEffect } from "react";

import SlidesPanel from "./components/SlidesPanel/SlidesPanel";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import AgentPanel from "./components/AgentPanel/AgentPanel";
import TopBar from "./components/TopBar/TopBar";
import CanvasShell from "./components/Canvas/CanvasShell";
import PresentationMode from "./present/PresentationMode";

import { useParams, useNavigate } from "react-router-dom";
import usePresentationStore from "./store/usePresentationStore";
import { getPresentationById } from "../../services/presentation";
import LoadingSpinner from "../../components/loading/LoadingSpinner"; // Assuming you have one, or use simple text

const PresentationWorkspace = ({ initialData, layout: propLayout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPresenting, setIsPresenting] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  // Loading if ID is present and we don't have initialData
  const [isLoading, setIsLoading] = useState(!!id && !initialData);
  const [error, setError] = useState(null);

  const { setPresentation, resetPresentation } = usePresentationStore();

  useEffect(() => {
    if (initialData) {
      console.log("--- Workspace: Using initialData from props:", initialData);
      setPresentation(initialData);
      setIsLoading(false);
    } else if (id) {
      setIsLoading(true);
      getPresentationById(id)
        .then((data) => {
          console.log("--- Workspace: Fetched data for ID:", id, data);
          // Normalize data if necessary (e.g. if API returns { data: ... })
          const pptData = data.data || data;
          // Ensure ID is present in the data passed to store
          if (!pptData.id && !pptData._id && !pptData.presentationId && id) {
            pptData.id = id;
          }
          // Ensure title is present
          if (!pptData.title && data.title) {
            pptData.title = data.title;
          }
          setPresentation(pptData);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load presentation:", err);
          setError("Failed to load presentation");
          setIsLoading(false);
        });
    } else {
      // New presentation -> Reset store
      console.log("--- Workspace: New presentation, resetting store.");
      resetPresentation();
      setIsLoading(false);
    }
  }, [id, initialData, setPresentation, resetPresentation]);

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
    <div style={styles.root}>
      <TopBar
        onPresent={() => setIsPresenting(true)}
        onAgentClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
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
    display: "flex"
  }
};

export default PresentationWorkspace;