import React from "react";

import SlidesPanel from "./components/SlidesPanel/SlidesPanel";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import TopBar from "./components/TopBar/TopBar";
import CanvasShell from "./components/Canvas/CanvasShell";

const PresentationWorkspace = () => {
  return (
    <div style={styles.root}>
      <TopBar />

      <div style={styles.body}>
        <SlidesPanel />

        <CanvasShell />

        <PropertiesPanel />
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