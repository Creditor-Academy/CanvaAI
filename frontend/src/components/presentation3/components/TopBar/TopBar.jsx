import React from "react";
import TopBarRow1 from "./TopBarRow1";
import TopBarToolbar from "./TopBarToolbar";

const TopBar = ({ onPresent }) => {
  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
      {/* Row 1: Static Header */}
      <TopBarRow1 onPresent={onPresent} />

      {/* Row 2: Floating Toolbar */}
      <TopBarToolbar />
    </div>
  );
};

export default TopBar;
