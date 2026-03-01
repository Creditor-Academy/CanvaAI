import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
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
  const location = useLocation();
  const passedData = location.state?.presentationData;

  const [isPresenting, setIsPresenting] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { setPresentation, resetPresentation, setPresentationId, setTitle } =
    usePresentationStore();

  useEffect(() => {
    const loadPresentation = async () => {
      try {
        setIsLoading(true);

        // ✅ CASE 1: Data from navigation
        if (passedData) {
          const normalized = {
            id: passedData.id || passedData._id,
            title: passedData.title || "Untitled Presentation",
            slides:
              passedData.slides ||
              (passedData.data && passedData.data.slides) ||
              [],
          };

          setPresentation(normalized);
          setPresentationId(normalized.id);
          setTitle(normalized.title);

          setIsLoading(false);
          return;
        }

        // ✅ CASE 2: Data from sessionStorage
        const storedData = sessionStorage.getItem("presentationData");
        if (storedData) {
          const parsed = JSON.parse(storedData);

          const normalized = {
            id: parsed.id || parsed._id,
            title: parsed.title || "Untitled Presentation",
            slides:
              parsed.slides ||
              (parsed.data && parsed.data.slides) ||
              [],
          };

          setPresentation(normalized);
          setPresentationId(normalized.id);
          setTitle(normalized.title);

          setIsLoading(false);
          return;
        }

        // ✅ CASE 3: Fetch using URL id
        if (id) {
          const response = await getPresentationById(id);
          const apiData = response.data || response;

          const normalized = {
            id: apiData._id || apiData.id,
            title: apiData.title || "Untitled Presentation",
            slides:
              apiData.data?.slides ||
              apiData.slides ||
              [],
          };

          setPresentation(normalized);
          setPresentationId(normalized.id);
          setTitle(normalized.title);
        } else {
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
  }, [id, passedData]);

  if (isLoading) {
    return <div style={styles.center}>Loading Presentation...</div>;
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
  root: { height: "100vh", display: "flex", flexDirection: "column" },
  body: { flex: 1, display: "flex" },
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default PresentationWorkspace;