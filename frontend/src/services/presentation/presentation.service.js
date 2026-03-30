import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${BASE_URL}/api/presentation`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

const IMAGE_API_URL = `${BASE_URL}/api/image`;

const safeStringify = (data) => {
    try {
        return JSON.stringify(data);
    } catch {
        return "{}";
    }
};

const uploadImageTempToReal = async (url, userId, folder, serviceId) => {
    try {
        const payload = {
            url,
            userId,
            folder,
            serviceId
        };
        const res = await axios.post(`${IMAGE_API_URL}/upload/temp/real`, payload, getAuthHeaders());
        return res.data.url; // Return the new permanent URL
    } catch (error) {
        console.error("Error uploading image from temp to real:", error);
        return url; // Return original URL if failed, so we don't break the presentation
    }
};

const processPresentationImages = async (presentationData, userId, serviceId) => {
    // Deep clone to avoid mutating original state directly if passed from store
    // However, for API payload, we can just process it.
    // We need to traverse:
    // 1. slides -> background (if image)
    // 2. slides -> layers -> (if image layer) src, imageUrl

    if (!presentationData || !presentationData.slides) return presentationData;

    const slides = presentationData.slides;

    for (const slide of slides) {
        // 1. Process Slide Background Image
        if (slide.backgroundImage && slide.backgroundImage.includes("/temp/")) {
            const newUrl = await uploadImageTempToReal(slide.backgroundImage, userId, "presentation", serviceId);
            if (newUrl !== slide.backgroundImage) {
                slide.backgroundImage = newUrl;
                // If the key is derived from URL, we might need to update it too, but backend response gives key.
                // For now, simplistically assume we just need to update the URL usage.
                // The user logic mentions "key" in response, but we are primarily swapping URLs. 
            }
        }

        // 2. Process Layers
        if (slide.layers) {
            for (const layer of slide.layers) {
                if (layer.type === "image" && (layer.src?.includes("/temp/") || layer.imageUrl?.includes("/temp/"))) {
                    // Check src
                    if (layer.src && layer.src.includes("/temp/")) {
                        const newUrl = await uploadImageTempToReal(layer.src, userId, "presentation", serviceId);
                        layer.src = newUrl;
                    }
                    // Check imageUrl (some models use this)
                    if (layer.imageUrl && layer.imageUrl.includes("/temp/")) {
                        const newUrl = await uploadImageTempToReal(layer.imageUrl, userId, "presentation", serviceId);
                        layer.imageUrl = newUrl;
                    }
                }
            }
        }
    }

    return presentationData;
};

export const savePresentation = async (payload) => {
    // 1. Initial Save to generate the Presentation ID
    // We cannot process images BEFORE this because we need the 'serviceId' (Presentation ID) 
    // for the S3 folder path logic requested by the user.
    const saveRes = await axios.post(`${API_URL}/save`, payload, getAuthHeaders());
    const newPptId = saveRes.data.presentationId || saveRes.data._id;

    // 2. Process Images (Temp -> Real) using the new ID
    if (newPptId && payload.data) {
        // We check if there are any temp images. 
        // We treat 'payload.data' as the source of truth.
        // We clone it to compare later, or just check if processPresentationImages returns modified count (if we added that).
        // Since processPresentationImages mutates in place (or we can make it return a flag), 
        // we'll rely on string comparison for simplicity or just run update if we see temp images.

        // Optimization: Check for "/temp/" string existence before running heavy logic?
        const hasTempImages = JSON.stringify(payload.data).includes("/temp/");

        if (hasTempImages) {
            console.log("Temp images detected in new presentation. Processing migration...");
            await processPresentationImages(payload.data, payload.userId, newPptId);

            // 3. Update the presentation with the resolved real URLs
            console.log("Updating new presentation with real image URLs...");

            // Note: updatePresentation expects (id, payload). 
            // We reuse the payload object which now has the updated URLs in 'data'.
            // Ensure payload has 'userId' if updatePresentation needs it (it handles extraction).
            await updatePresentation(newPptId, payload);
        }
    }

    return saveRes.data;
};

export const updatePresentation = async (id, payload) => {
    // payload: { title, data }
    // id is the presentationId (serviceId)
    // Extract userId from payload or store? 
    // `updatePresentation` signature: (id, payload). Payload usually has data.
    // We need userId. It might not be in payload for update (auth header handles it on backend).
    // We need to find userId. 
    // We can decode token or expect it in payload.
    // Let's assume payload might have it or we can't do it?
    // Wait, the `uploadImageTempToReal` needs `userId`.
    // Let's check `getAuthHeaders` - it gets token. 
    // We can't easily get userId here without decoding jwt or if it's passed.
    // Inspecting `savePresentation` call in `AdminDash` or `TopBar`: usually passes userId.
    // For `update`, typically we might not pass userId if strictly RESTful.
    // But `processPresentationImages` NEEDS it.
    // I will try to extract `userId` from payload. If not there, I'll check localStorage "user" or similar if common pattern?
    // Or just ask user/assume it's in payload?
    // The user provided request body for temp-to-real has `userId`.

    let userId = payload.userId;
    if (!userId) {
        // Fallback: Try to get from localStorage if available (often stored with token)
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                userId = JSON.parse(userStr)._id || JSON.parse(userStr).id;
            } catch (e) { console.error("Error parsing user from localstorage", e); }
        }
    }

    if (userId) {
        await processPresentationImages(payload.data || payload, userId, id);
    } else {
        console.warn("Cannot process images for intemp-to-real migration: Missing userId");
    }

    const res = await axios.put(`${API_URL}/update/${id}`, payload, getAuthHeaders());
    return res.data;
};

export const listPresentations = async (userId) => {
    // If userId is provided as param, use it, otherwise the backend might extract from token
    const res = await axios.get(`${API_URL}/list/${userId}`, getAuthHeaders());
    return res.data;
};

export const getPresentationById = async (pptId, userId, template = false) => {
    const res = await axios.get(`${API_URL}/get/ppt/${pptId}?userId=${userId}&template=${template}`, getAuthHeaders());
    console.log(res);
    return res.data;
};

export const getPublicTemplateById = async (pptId) => {
    // Endpoint: http://localhost:5000/api/public/templates/ppt/:pptId
    const res = await axios.get(`${BASE_URL}/api/public/templates/ppt/${pptId}`, getAuthHeaders());
    return res.data;
};

export const getAdminTemplates = async () => {
    // Endpoint: http://localhost:5000/api/public/templates/ppt
    // We use BASE_URL to ensure it works in both dev and prod
    const res = await axios.get(`${BASE_URL}/api/public/templates/ppt`, getAuthHeaders());
    // Assuming the response structure is { success: true, data: [...] } or just an array
    return res.data?.data || res.data || [];
};

export const deletePresentation = async (id, userId) => {
    const folderPath = `presentation/${userId}/${id}/`;
    const res = await axios.delete(`${API_URL}/delete/${id}`, {
        ...getAuthHeaders(),
        data: { folderPath }
    });
    return res.data;
};

/**
 * Generate image for PPT via API.
 * POST /api/image/generate-image/:userId/:pptId with body { prompt }.
 * Response can be: { created, data: [{ b64_json, revised_prompt, url }] }
 * or directly: { url, revised_prompt, b64_json, key }
 */

export const generateAIImage = async ({ userId, pptId, userPrompt, activeSlideData }) => {
    const apiUrl = `${BASE_URL}/api/image/generate-image/${userId}/${pptId}`;

    // Inject activeSlide JSON inside the prompt string as context
    const finalPrompt = `
You are generating a visual image for a presentation slide.

Your goal is to create a high-quality, meaningful image that:
1. Directly reflects the user's instruction below.
2. Is contextually aligned with the slide content (title, text, and layout).
3. Enhances the slide visually — avoid generic or unrelated imagery.

User Instruction:
${userPrompt}

Slide Context (use this to make the image relevant and coherent with the slide):
${safeStringify(activeSlideData)}

Generate an image that a viewer would immediately associate with this slide's message.
`;

    const res = await axios.post(apiUrl, { prompt: finalPrompt }, getAuthHeaders());

    // Support both wrapped (DALL-E style) and unwrapped response structures
    const first = res.data?.data?.[0] || res.data;

    if (!first || (!first.url && !first.b64_json && !first.base64)) {
        throw new Error("No image data in response");
    }

    // Extract key from URL if not provided by backend
    let key = first.key;
    if (!key && first.url) {
        try {
            const urlObj = new URL(first.url);
            // pathname usually is /temp/userId/pptId/filename.png
            key = urlObj.pathname.substring(1);
        } catch (e) {
            console.warn("Failed to extract key from URL:", first.url);
        }
    }

    return {
        url: first.url,
        revised_prompt: first.revised_prompt,
        b64_json: first.b64_json || first.base64,
        key: key
    };
};

export const generateAISlide = async ({ userId, pptId, userPrompt, presentationData, mediaStyle }) => {
    const apiUrl = `${BASE_URL}/api/pp/generate-slide/${userId}/${pptId}`;

    const slideContent = JSON.stringify({
        instruction: userPrompt,
        fullPresentation: presentationData
    });

    const payload = {
        slideContent: slideContent,
        mediaStyle: mediaStyle
    };

    console.log(`--- PresentationService: generateAISlide POST ${apiUrl}`, payload);
    const res = await axios.post(apiUrl, payload, getAuthHeaders());
    return res.data;
};

export const expandAISlide = async ({ userId, pptId, activeSlide, userPrompt, mediaStyle }) => {
    const apiUrl = `${BASE_URL}/api/pp/expand-slide/${userId}/${pptId}`;

    // Backend expects raw slide object in slideContent, and string in prompt
    const payload = {
        slideContent: activeSlide, // RAW object (no stringify)
        prompt: userPrompt,
        mediaStyle: mediaStyle
    };

    console.log(`--- PresentationService: expandAISlide POST ${apiUrl}`, payload);
    const res = await axios.post(apiUrl, payload, getAuthHeaders());
    return res.data;
};

export const exportPresentation = async (id, format) => {
    try {
        const url = `${BASE_URL}/api/pp/${id}/export?format=${format}`;
        const response = await axios.get(url, {
            ...getAuthHeaders(),
            responseType: 'blob'
        });

        // Error Handling for Blob Failures
        if (response.data.type === "application/json") {
            const text = await response.data.text();
            const error = JSON.parse(text);
            throw new Error(error.message || "Export failed");
        }

        // Filename Handling
        const contentDisposition = response.headers['content-disposition'];
        let fileName = `presentation.${format}`;

        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match?.[1]) fileName = match[1];
        }

        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // Memory Cleanup
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        return { success: true };
    } catch (error) {
        console.error(`Export to ${format} failed:`, error);
        throw error;
    }
};
