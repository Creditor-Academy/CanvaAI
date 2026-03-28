import React, { useState } from "react";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

const styles = {
    realistic: 'photorealistic, ultra detailed, DSLR photography, cinematic lighting: ${prompt}',
    anime: 'anime style illustration, japanese anime art, vibrant colors: ${prompt}',
    cartoon: 'cartoon style illustration, disney pixar style, colorful: ${prompt}',
    sketch: 'pencil sketch drawing, black and white illustration: ${prompt}',
    painting: 'oil painting style, artistic brush strokes: ${prompt}',
};

const applyStyle = (prompt, filter) => {
    const template = styles[filter];
    if (!template) return prompt;
    return template.replace('${prompt}', prompt);
};

export const generateImage = async (userId, serviceId, prompt, filter = 'realistic') => {
    try {
        const styledPrompt = applyStyle(prompt, filter);
        const body = { prompt: styledPrompt, filter };
        const res = await api.post(`/api/image/generate-image/${userId}/${encodeURIComponent(serviceId)}`, body);
        console.log("Generate Image Response:", res.data);
        // backend developer said response = res.url; handle both shapes
        return res.data || { url: res.url };
    } catch (error) {
        console.error("Generate Image Error:", error.response?.data || error.message);
        throw error;
    }
};

export default function AIImageGenerator({ userId, serviceId, initialPrompt = '', onGenerated }) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [loading, setLoading] = useState(false);
    const [resultUrl, setResultUrl] = useState(null);

    const styleKeys = Object.keys(styles);

    const handleGenerate = async (filter) => {
        if (!userId || !serviceId) {
            console.warn('userId and serviceId are required');
            return;
        }
        setLoading(true);
        try {
            const res = await generateImage(userId, serviceId, prompt, filter);
            const url = res.url || res;
            setResultUrl(url);
            if (onGenerated) onGenerated(url);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        React.createElement('input', {
            value: prompt,
            onChange: (e) => setPrompt(e.target.value),
            placeholder: 'Enter prompt',
            style: { padding: 8, fontSize: 14 },
        }),
        React.createElement(
            'div',
            { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            ...styleKeys.map((s) => React.createElement('button', { key: s, onClick: () => handleGenerate(s), disabled: loading }, s))
        ),
        loading && React.createElement('div', null, 'Generating...'),
        resultUrl && React.createElement('div', null, 'Result URL: ', React.createElement('a', { href: resultUrl, target: '_blank', rel: 'noreferrer' }, resultUrl))
    );
}


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

// Clone a public template into the current user's account
export const cloneImage = async (pptId) => {
    try {
        const res = await api.get(`/api/images/clone/${pptId}`);
        return res.data;
    } catch (error) {
        console.error('Clone Image Error:', error.response?.data || error.message);
        throw error;
    }
};

