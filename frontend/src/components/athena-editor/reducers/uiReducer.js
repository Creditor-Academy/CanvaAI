const initialState = {
  isOutlineOpen: false,
  showReferencesPanel: false,
  isAISidebarOpen: false,
  showTemplateSidebar: false,
  showExportDialog: false,
  showImageModal: false,
  showFormatMenu: false,
  showVersionHistory: false,
  showPageSetup: false,
  isRenaming: false,
  showInsertMenu: false,
  isDarkMode: false,
  showRuler: false,
  showGrid: false,
  spellCheckEnabled: true
};

export const uiReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'TOGGLE_OUTLINE':
      return { ...state, isOutlineOpen: !state.isOutlineOpen };
    case 'SET_OUTLINE_OPEN':
      return { ...state, isOutlineOpen: action.payload };
    case 'TOGGLE_REFERENCES_PANEL':
      return { ...state, showReferencesPanel: !state.showReferencesPanel };
    case 'SET_REFERENCES_PANEL':
      return { ...state, showReferencesPanel: action.payload };
    case 'TOGGLE_AI_SIDEBAR':
      return { ...state, isAISidebarOpen: !state.isAISidebarOpen };
    case 'SET_AI_SIDEBAR':
      return { ...state, isAISidebarOpen: action.payload };
    case 'TOGGLE_TEMPLATE_SIDEBAR':
      return { ...state, showTemplateSidebar: !state.showTemplateSidebar };
    case 'SET_TEMPLATE_SIDEBAR':
      return { ...state, showTemplateSidebar: action.payload };
    case 'TOGGLE_EXPORT_DIALOG':
      return { ...state, showExportDialog: !state.showExportDialog };
    case 'SET_EXPORT_DIALOG':
      return { ...state, showExportDialog: action.payload };
    case 'TOGGLE_IMAGE_MODAL':
      return { ...state, showImageModal: !state.showImageModal };
    case 'SET_IMAGE_MODAL':
      return { ...state, showImageModal: action.payload };
    case 'TOGGLE_FORMAT_MENU':
      return { ...state, showFormatMenu: !state.showFormatMenu };
    case 'SET_FORMAT_MENU':
      return { ...state, showFormatMenu: action.payload };
    case 'TOGGLE_VERSION_HISTORY':
      return { ...state, showVersionHistory: !state.showVersionHistory };
    case 'SET_VERSION_HISTORY':
      return { ...state, showVersionHistory: action.payload };
    case 'TOGGLE_PAGE_SETUP':
      return { ...state, showPageSetup: !state.showPageSetup };
    case 'SET_PAGE_SETUP':
      return { ...state, showPageSetup: action.payload };
    case 'SET_RENAMING':
      return { ...state, isRenaming: action.payload };
    case 'TOGGLE_INSERT_MENU':
      return { ...state, showInsertMenu: !state.showInsertMenu };
    case 'SET_INSERT_MENU':
      return { ...state, showInsertMenu: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_DARK_MODE':
      return { ...state, isDarkMode: action.payload };
    case 'TOGGLE_RULER':
      return { ...state, showRuler: !state.showRuler };
    case 'SET_RULER':
      return { ...state, showRuler: action.payload };
    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };
    case 'SET_GRID':
      return { ...state, showGrid: action.payload };
    case 'TOGGLE_SPELL_CHECK':
      return { ...state, spellCheckEnabled: !state.spellCheckEnabled };
    case 'SET_SPELL_CHECK':
      return { ...state, spellCheckEnabled: action.payload };
    default:
      return state;
  }
};

export const toggleOutline = () => ({ type: 'TOGGLE_OUTLINE' });
export const setOutlineOpen = (isOpen) => ({ type: 'SET_OUTLINE_OPEN', payload: isOpen });
export const toggleReferencesPanel = () => ({ type: 'TOGGLE_REFERENCES_PANEL' });
export const setReferencesPanel = (isVisible) => ({ type: 'SET_REFERENCES_PANEL', payload: isVisible });
export const toggleAISidebar = () => ({ type: 'TOGGLE_AI_SIDEBAR' });
export const setAISidebar = (isOpen) => ({ type: 'SET_AI_SIDEBAR', payload: isOpen });
export const toggleTemplateSidebar = () => ({ type: 'TOGGLE_TEMPLATE_SIDEBAR' });
export const setTemplateSidebar = (isOpen) => ({ type: 'SET_TEMPLATE_SIDEBAR', payload: isOpen });
export const toggleExportDialog = () => ({ type: 'TOGGLE_EXPORT_DIALOG' });
export const setExportDialog = (isOpen) => ({ type: 'SET_EXPORT_DIALOG', payload: isOpen });
export const toggleImageModal = () => ({ type: 'TOGGLE_IMAGE_MODAL' });
export const setImageModal = (isOpen) => ({ type: 'SET_IMAGE_MODAL', payload: isOpen });
export const toggleFormatMenu = () => ({ type: 'TOGGLE_FORMAT_MENU' });
export const setFormatMenu = (isVisible) => ({ type: 'SET_FORMAT_MENU', payload: isVisible });
export const toggleVersionHistory = () => ({ type: 'TOGGLE_VERSION_HISTORY' });
export const setVersionHistory = (isVisible) => ({ type: 'SET_VERSION_HISTORY', payload: isVisible });
export const togglePageSetup = () => ({ type: 'TOGGLE_PAGE_SETUP' });
export const setPageSetup = (isVisible) => ({ type: 'SET_PAGE_SETUP', payload: isVisible });
export const setRenaming = (isRenaming) => ({ type: 'SET_RENAMING', payload: isRenaming });
export const toggleInsertMenu = () => ({ type: 'TOGGLE_INSERT_MENU' });
export const setInsertMenu = (isVisible) => ({ type: 'SET_INSERT_MENU', payload: isVisible });
export const toggleDarkMode = () => ({ type: 'TOGGLE_DARK_MODE' });
export const setDarkMode = (isEnabled) => ({ type: 'SET_DARK_MODE', payload: isEnabled });
export const toggleRuler = () => ({ type: 'TOGGLE_RULER' });
export const setRuler = (isVisible) => ({ type: 'SET_RULER', payload: isVisible });
export const toggleGrid = () => ({ type: 'TOGGLE_GRID' });
export const setGrid = (isVisible) => ({ type: 'SET_GRID', payload: isVisible });
export const toggleSpellCheck = () => ({ type: 'TOGGLE_SPELL_CHECK' });
export const setSpellCheck = (isEnabled) => ({ type: 'SET_SPELL_CHECK', payload: isEnabled });