import React, { useState, useEffect, useCallback, useRef } from "react";
import usePresentationStore from "../store/usePresentationStore";
import SlidePresenter from "./SlidePresenter";

const PresentationMode = ({ onExit }) => {
    const { slides, activeSlideId } = usePresentationStore();

    // Find initial slide index based on activeSlideId
    const initialIndex = slides.findIndex(s => s.id === activeSlideId);
    const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

    const nextSlide = useCallback(() => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Option: Exit if next on last slide
            // onExit();
        }
    }, [currentIndex, slides.length]);

    const prevSlide = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    // Handle Fullscreen
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (containerRef.current && !document.fullscreenElement) {
                    await containerRef.current.requestFullscreen();
                }
            } catch (err) {
                console.warn("Fullscreen request failed", err);
            }
        };
        enterFullscreen();

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                onExit();
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, [onExit]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
                nextSlide();
            } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
                prevSlide();
            } else if (e.key === "Escape") {
                onExit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nextSlide, prevSlide, onExit]);

    // Response Scale Calculation
    useEffect(() => {
        const calcScale = () => {
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;
            const sW = clientWidth / 960;
            const sH = clientHeight / 540;
            setScale(Math.min(sW, sH)); // Use full fit
        };

        calcScale();
        window.addEventListener("resize", calcScale);
        return () => window.removeEventListener("resize", calcScale);
    }, []);

    const currentSlide = slides[currentIndex];

    if (!currentSlide) return null;

    return (
        <div
            ref={containerRef}
            onClick={nextSlide}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "#000",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                cursor: "pointer",
                overflow: "hidden",
            }}
        >
            <SlidePresenter slide={currentSlide} scale={scale} />

            {/* HUD / Overlay */}
            <div
                style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "14px",
                    pointerEvents: "none",
                }}
            >
                {currentIndex + 1} / {slides.length}
            </div>

            <div
                style={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "12px",
                    pointerEvents: "none",
                }}
            >
                Press Esc to exit
            </div>
        </div>
    );
};

export default PresentationMode;
