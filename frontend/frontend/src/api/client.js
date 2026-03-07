import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:4000/api";
const API_TIMEOUT_MS = Number(process.env.REACT_APP_API_TIMEOUT_MS || 65000);

function stringifyDetails(details) {
  if (!details) {
    return "";
  }

  if (typeof details === "string") {
    return details;
  }

  if (typeof details === "object") {
    if (typeof details.error === "string") {
      return details.error;
    }
    if (typeof details.details === "string") {
      return details.details;
    }
    return JSON.stringify(details);
  }

  return String(details);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 65000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      const primaryError = error.response.data.error;
      const detailsText = stringifyDetails(error.response.data.details);
      const message = detailsText ? `${primaryError}: ${detailsText}` : primaryError;
      return Promise.reject(new Error(message));
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("Request timeout. AI model warm-up ho sakta hai, 20-40s baad retry karein.")
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
