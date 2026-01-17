# Presentation Editor 2

Professional presentation canvas editor built with React, react-konva, and Tailwind CSS.

## Architecture

### Folder Structure

```
presentation2/
├── components/          # UI Components
│   ├── TopBar.jsx       # Top toolbar
│   ├── SlidesPanel.jsx  # Left panel with slide thumbnails
│   ├── RightPanel.jsx   # Right panel (Themes, AI, Present)
│   ├── CanvasShell.jsx  # Canvas container wrapper
│   └── StageWrapper.jsx # React-konva Stage wrapper
├── hooks/               # Custom React hooks
│   ├── useHistory.js    # Undo/redo functionality
│   ├── useZoom.js       # Zoom and pan management
│   ├── useSelection.js  # Layer selection management
│   └── useAlignmentGuides.js # Alignment guide calculations
├── models/              # Data models
│   └── presentationModel.js # Presentation data structure
├── utils/               # Utility functions
│   └── canvasUtils.js   # Canvas calculations
├── PresentationWorkspace.jsx # Main orchestrator
└── index.js            # Module exports
```

## Core Principles

1. **Data Model as Single Source of Truth**: All presentation data follows the model in `models/presentationModel.js`
2. **Canvas Logic Isolated**: Canvas rendering logic is separate from UI logic
3. **AI is NOT Part of Canvas**: AI tools are placeholders only, not integrated into canvas logic
4. **Modular Architecture**: Each component has a single responsibility
5. **No Business Logic in UI**: UI components are presentational only

## Data Model

### Presentation
```javascript
{
  id: string,
  title: string,
  slides: Slide[],
  settings: {
    width: number,  // Default: 960
    height: number  // Default: 540
  }
}
```

### Slide
```javascript
{
  id: string,
  name: string,
  background: string, // Hex color
  layers: Layer[]
}
```n

### Layer
```javascript
{
  id: string,
  type: 'text' | 'image' | 'shape',
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  visible: boolean,
  locked: boolean,
  style: object // Type-specific styles
}
```

## Usage

### Opening the Editor

Navigate to `/presentation-editor` to open a new empty presentation, or `/presentation-editor/:id` to open an existing one.

The editor opens in full-screen mode (no sidebar).

### Creating a Presentation Programmatically

```javascript
import { createEmptyPresentation, createLayer } from './components/presentation2';

const presentation = createEmptyPresentation();
const textLayer = createLayer('text', {
  x: 100,
  y: 100,
  text: 'Hello World',
  fontSize: 24
});
presentation.slides[0].layers.push(textLayer);
```

## TODO: Implementation Checklist

### Canvas Rendering
- [ ] Implement layer rendering in StageWrapper
- [ ] Add text layer rendering (Konva Text)
- [ ] Add image layer rendering (Konva Image)
- [ ] Add shape layer rendering (Konva Rect/Circle/etc.)
- [ ] Add selection highlighting
- [ ] Add transform handles (resize, rotate)

### Interactions
- [ ] Implement layer drag
- [ ] Implement layer resize
- [ ] Implement layer rotation
- [ ] Implement multi-select
- [ ] Implement alignment guides rendering
- [ ] Implement alignment guide calculations

### Tools
- [ ] Text tool: Create text on click
- [ ] Image tool: Open image picker
- [ ] Shape tool: Create shape on click
- [ ] Background tool: Open color picker
- [ ] Theme tool: Apply theme to presentation

### Features
- [ ] Save presentation
- [ ] Export presentation
- [ ] Present mode (fullscreen)
- [ ] Keyboard shortcuts
- [ ] Copy/paste layers

## Development Notes

- All canvas styling uses inline styles or Konva properties, NOT Tailwind
- UI components use Tailwind CSS
- Hooks manage state, components are presentational
- Alignment guides are calculated but not yet rendered
- AI tools are placeholders only
