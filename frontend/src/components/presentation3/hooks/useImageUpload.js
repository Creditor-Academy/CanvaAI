import { useState } from 'react';
import api from '../../../services/api';

export const useImageUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const uploadFile = async (file, userId, pptId) => {
        setIsUploading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async () => {
                try {
                    const base64Image = reader.result;
                    const response = await api.uploadTemporaryImage({
                        userId,
                        serviceId: pptId,
                        base64Image,
                    });

                    if (response && response.url && response.key) {
                        resolve({
                            url: response.url,
                            key: response.key,
                        });
                    } else {
                        throw new Error('Invalid response from upload API');
                    }
                } catch (err) {
                    console.error('Upload failed:', err);
                    setError(err.message || 'Upload failed');
                    reject(err);
                } finally {
                    setIsUploading(false);
                }
            };

            reader.onerror = (err) => {
                console.error('File reading failed:', err);
                setError('File reading failed');
                setIsUploading(false);
                reject(err);
            };

            reader.readAsDataURL(file);
        });
    };

    return {
        uploadFile,
        isUploading,
        error,
    };
};

export default useImageUpload;
