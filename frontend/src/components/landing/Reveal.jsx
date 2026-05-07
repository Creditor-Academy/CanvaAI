import React from "react";

const Reveal = ({ children, delay = 0, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default Reveal;