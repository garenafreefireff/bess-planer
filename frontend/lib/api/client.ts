import axios from "axios";

const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Add it to frontend/.env.local.");
}

const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
