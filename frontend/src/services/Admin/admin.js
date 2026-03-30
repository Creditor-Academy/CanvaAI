import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API = axios.create({
  baseURL: `${BASE_URL}/api/presentation` 
});

// 🔥 Add interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// PUBLIC
export const getPublicPresentations = async (userId) => {
  const res = await API.get(`/get-all-public/${userId}`);
  return res.data?.presentations || [];
};

// PRIVATE
export const getUnpublicPresentations = async (userId) => {
  const res = await API.get(`/get-all-unpublic/${userId}`);
  return res.data?.presentations || [];
};

//Update Visibility
export const updatePPTVisibility = (presentationId, userId, isPublic) =>
  API.put(`/update/ppt/visibility/${presentationId}`, {
    userId,
    isPublic,
  });
