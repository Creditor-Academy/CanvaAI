// Test function to verify new tab opening
export const testEditorTab = () => {
  const editorUrl = `${window.location.origin}/editor-tab`;
  const newWindow = window.open(
    editorUrl, 
    '_blank', 
    'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes'
  );
  
  if (!newWindow) {
    console.warn('Popup blocked - editor will open in same tab');
    window.location.href = '/editor-tab';
  } else {
    console.log('Editor opened in new tab successfully');
  }
};

// Alternative method using anchor tag
export const openEditorInNewTab = () => {
  const link = document.createElement('a');
  link.href = '/editor-tab';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.click();
};