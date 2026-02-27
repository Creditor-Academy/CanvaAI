import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SlidesPanel from "./components/SlidesPanel/SlidesPanel";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import AgentPanel from "./components/AgentPanel/AgentPanel";
import TopBar from "./components/TopBar/TopBar";
import CanvasShell from "./components/Canvas/CanvasShell";
import PresentationMode from "./present/PresentationMode";

import usePresentationStore from "./store/usePresentationStore";
import { getPresentationById } from "../../services/presentation";

const PresentationWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const passedData = location.state?.presentationData;

  const [isPresenting, setIsPresenting] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { setPresentation, resetPresentation } = usePresentationStore();

  useEffect(() => {
    const loadPresentation = async () => {
      try {
        setIsLoading(true);

        // ✅ CASE 1: Data passed from navigation
        if (passedData) {
          console.log("Using passed data:", passedData);

          const normalizedData = {
            id: passedData.id || passedData._id,
            title: passedData.title,
            slides:
              passedData.slides ||
              (passedData.data && passedData.data.slides) ||
              []
          };

          setPresentation(normalizedData);
          setIsLoading(false);
          return;
        }

        // ✅ CASE 2: Fetch from API using ID
        if (id) {
          const response = await getPresentationById(id);

          const apiData = response.data || response;

          const normalizedData = {
            id: apiData.id || apiData._id,
            title: apiData.title,
            slides:
              apiData.slides ||
              (apiData.data && apiData.data.slides) ||
              []
          };

          setPresentation(normalizedData);
        } else {
          // ✅ CASE 3: New presentation
          resetPresentation();
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading presentation:", err);
        setError("Failed to load presentation");
        setIsLoading(false);
      }
    };

    loadPresentation();
  }, [id, passedData, setPresentation, resetPresentation]);

  if (isLoading) {
    return (
      <div style={styles.center}>
        Loading Presentation...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.center, color: "red" }}>
        {error}
      </div>
    );
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
  },
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
};

export default PresentationWorkspace;