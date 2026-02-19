import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/presentation`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const savePresentation = async (payload) => {
    const res = await axios.post(`${API_URL}/save`, payload, getAuthHeaders());
    return res.data;
};

export const updatePresentation = async (id, payload) => {
    const res = await axios.put(`${API_URL}/update/${id}`, payload, getAuthHeaders());
    return res.data;
};

export const listPresentations = async (userId) => {
    // If userId is provided as param, use it, otherwise the backend might extract from token
    const res = await axios.get(`${API_URL}/list/${userId}`, getAuthHeaders());
    return res.data;
};

export const getPresentationById = async (pptId) => {
    const res = await axios.get(`${API_URL}/get/ppt/${pptId}`, getAuthHeaders());
    return res.data;
};

export const deletePresentation = async (id) => {
    const res = await axios.delete(`${API_URL}/delete/${id}`, getAuthHeaders());
    return res.data;
};
