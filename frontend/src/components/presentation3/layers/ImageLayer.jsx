import React from "react";

const ImageLayer = ({ layer }) => {
    return (
        <img
            src={layer.imageUrl || layer.src}
            alt="User Layer"
            draggable={false}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "fill",
                pointerEvents: "none", // Let the wrapper handle events
                display: "block",
            }}
        />
    );
};

export default ImageLayer;
