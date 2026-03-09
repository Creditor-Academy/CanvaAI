import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const saveImage = async (payload) => {
    try {
        const res = await api.post("/api/images/save", payload);
        return res.data;
    } catch (error) {
        console.error("Save Image Error:", error.response?.data || error.message);
        throw error;
    }
};

export const getUserImages = async (userId) => {
    try {
        const res = await api.get(`/api/images/list/${userId}`);
        console.log("Fetched User Images:", res.data);
        return res.data;
    } catch (error) {
        console.error("Get User Images Error:", error.response?.data || error.message);
        throw error;
    }
};


export const getImageById = async (imageId) => {
    try {
        const res = await api.get(`/api/images/get/image/${imageId}`);
        return res.data;
    } catch (error) {
        console.error("Get Image By ID Error:", error.response?.data || error.message);
        throw error;
    }
};

export const deleteImage = async (imageId) => {
    try {
        const res = await api.delete(`/api/images/delete/${imageId}`);
        return res.data;
    } catch (error) {
        console.error("Delete Image Error:", error.response?.data || error.message);
        throw error;
    }
};

export const updateImageVisibility = async (imageId, payload) => {
    try {
        const res = await api.put(`/api/images/update/visibility/${imageId}`, payload);
        return res.data;
    } catch (error) {
        console.error("Update Image Visibility Error:", error.response?.data || error.message);
        throw error;
    }
};

export const updateImage = async (imageId, payload) => {
    try {
        const res = await api.put(`/api/images/update/${imageId}`, payload);
        return res.data;
    } catch (error) {
        console.error("Update Image Error:", error.response?.data || error.message);
        throw error;
    }
};

export const generateImage = async (userId, imageId, prompt) => {
    try {
        const res = await api.post(`/api/image/generate-image/${userId}/${encodeURIComponent(imageId)}`, { prompt });
        console.log("Generate Image Response:", res.data.url);
        console.log("Generate Image Response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Generate Image Error:", error.response?.data || error.message);
        throw error;
    }
};

export const exportImage = async (imageId, format) => {
    try {
        const res = await api.get(`/api/images/export/${imageId}/${format}`, { responseType: 'blob' });
        return res.data;
    } catch (error) {
        console.error('Export Image Error:', error.response?.data || error.message);
        throw error;
    }
};

export const uploadTemporaryImage = async (payload) => {
    try {
        const res = await api.post('/api/image/upload-image/temperary', payload);
        return res.data;
    } catch (error) {
        console.error('Upload Temporary Image Error:', error.response?.data || error.message);
        throw error;
    }
};


export const getPublicTemplateImages = async () => {
    try {
        const res = await api.get('/api/public/templates/images');
        console.log("Fetched Public Template Images:", res.data);
        return res.data;
    } catch (error) {
        console.error('Get Public Template Images Error:', error.response?.data || error.message);
        throw error;
    }
};




