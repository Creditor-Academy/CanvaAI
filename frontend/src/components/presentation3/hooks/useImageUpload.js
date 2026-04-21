import { useState } from 'react';
import { uploadImageFile } from '../utils/uploadImageUtil';

export const useImageUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const uploadFile = async (file, userId, pptId) => {
        setIsUploading(true);
        setError(null);

        try {
            const result = await uploadImageFile(file, userId, pptId);
            return result;
        } catch (err) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading,
        error,
    };
};

export default useImageUpload;
