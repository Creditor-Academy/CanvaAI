import React, { useRef, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { motion } from "framer-motion";
import SlideThumbnail from "./SlideThumbnail";
import usePresentationStore from "../../store/usePresentationStore";

const ItemTypes = {
  SLIDE: "slide",
};

const DraggableSlide = ({ slide, index, isActive }) => {
  const ref = useRef(null);
  const { moveSlide, setActiveSlide, duplicateSlide, deleteSlide, saveToHistory } = usePresentationStore();

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.SLIDE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      moveSlide(dragIndex, hoverIndex);

      // Auto-scroll logic (Throttled)
      let lastScrollTime = window.__lastScrollTime || 0;
      if (Date.now() - lastScrollTime > 50) {
        const container = document.querySelector('.slides-list');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const clientY = clientOffset.y;
          
          if (clientY < containerRect.top + 50) {
            container.scrollTop -= 15;
            window.__lastScrollTime = Date.now();
          } else if (clientY > containerRect.bottom - 50) {
            container.scrollTop += 15;
            window.__lastScrollTime = Date.now();
          }
        }
      }

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.SLIDE,
    item: () => {
      return { id: slide.id, index, originalIndex: index, slide };
    },
    end: (item, monitor) => {
      // If the slide was moved to a new position, save the history to trigger auto-save/changes
      if (item.originalIndex !== item.index) {
        saveToHistory();
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    // Hide the default HTML5 dragged image
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout="position"
      data-handler-id={handlerId}
      className={`slide-row ${isDragging ? "dragging" : ""}`}
      style={{
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        transform: isDragging ? "scale(1.03)" : "scale(1)",
        zIndex: isDragging ? 50 : 1,
      }}
    >
      <div className="slide-number">{index + 1}</div>

      <div className="slide-thumbnail-wrapper">
        <SlideThumbnail
          slide={slide}
          isActive={isActive}
          onClick={() => setActiveSlide(slide.id)}
        />

        <div className="slide-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateSlide(slide.id);
            }}
            className="duplicate-btn"
          >
            ⧉
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteSlide(slide.id);
            }}
            className="delete-btn"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DraggableSlide;
