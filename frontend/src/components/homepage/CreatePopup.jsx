import React from 'react';
import ChooseImageLayout from '../canva/ImageLayout/ChooseImageLayout';

const CreatePopup = ({ isOpen, onClose }) => {
  const handleLayoutSelect = (layout) => {
    onClose();
    try {
      sessionStorage.setItem(
        'new_layout_prefill',
        JSON.stringify({
          width: layout.width,
          height: layout.height,
          name: layout.name,
        })
      );
    } catch (e) {
      console.error(e);
    }
    window.open('/canva-clone', '_blank');
  };

  const handleQuickStartSelect = (option) => {
    onClose();
    window.open(option.route, '_blank');
  };

  return (
    <ChooseImageLayout
      open={isOpen}
      onClose={onClose}
      onSelect={handleLayoutSelect}
      showQuickStart
      onQuickStartSelect={handleQuickStartSelect}
      title="What would you like to create?"
    />
  );
};

export default CreatePopup;
