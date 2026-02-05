import React, { useState } from "react";

import SlidesPanel from "./components/SlidesPanel/SlidesPanel";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import AgentPanel from "./components/AgentPanel/AgentPanel";
import TopBar from "./components/TopBar/TopBar";
import CanvasShell from "./components/Canvas/CanvasShell";
import PresentationMode from "./present/PresentationMode";

const PresentationWorkspace = () => {
  const [isPresenting, setIsPresenting] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);

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