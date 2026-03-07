import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API request failed", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    const reqUrl = String(error.config?.url || "");
    const isAuthRequest = reqUrl.includes("/login") || reqUrl.includes("/signup") || reqUrl.includes("/auth/");

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post("/signup", { name, email, password }),
};

// Projects
export const projectsApi = {
  list: () => api.get("/projects"),
  create: (data: { name: string; repoUrl?: string | null }) => api.post("/projects", data),
  get: (id: string) => api.get(`/projects/${id}`),
  remove: async (id: string) => {
    try {
      return await api.delete(`/projects/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return api.post(`/projects/${id}/delete`);
      }
      throw error;
    }
  },
  pasteCode: (id: string, data: { fileName: string; content: string }) =>
    api.post(`/projects/${id}/paste`, data),
};

// Upload
export const uploadApi = {
  upload: (files: FormData) => api.post("/upload", files, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

// Reviews
export const reviewApi = {
  start: (projectId: string, versionId?: string) =>
    api.post(`/review/${projectId}`, {}, {
      params: versionId ? { versionId } : undefined,
    }),
  getByProject: (projectId: string, versionId?: string) =>
    api.get(`/review/project/${projectId}`, {
      params: versionId ? { versionId } : undefined,
    }),
};

// Comments
export const commentsApi = {
  list: (reviewId: string) => api.get(`/comments/${reviewId}`),
  create: (reviewId: string, message: string) =>
    api.post("/comments", { reviewId, message }),
};

export const versionsApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/versions`),
  get: (projectId: string, versionId: string) =>
    api.get(`/projects/${projectId}/versions/${versionId}`),
  compare: (projectId: string, v1: string, v2: string) =>
    api.get(`/projects/${projectId}/versions/compare`, { params: { v1, v2 } }),
};

export default api;
