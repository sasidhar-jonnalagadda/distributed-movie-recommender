import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Axios instance configured with secure defaults and base path.
 */
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// --- State for Refresh Token Synchronization ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

/**
 * Processes the queue of pending requests after a token refresh.
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- Request Interceptor ---
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => {
    // Auto-unwrap the `{ status: "success", data: T }` envelope
    return response.data?.data ?? response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Handle Token Refresh (401 Unauthorized)
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/signup")
    ) {
      if (isRefreshing) {
        // Queue the request until refresh is complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data.data; // Note: axios call here uses standard envelope
        localStorage.setItem("accessToken", accessToken);
        
        processQueue(null, accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          // Avoid redirecting if already on login
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // 2. Handle Infrastructure / Dependency Failures (502, 503, 504)
    if (error.response && [502, 503, 504].includes(error.response.status)) {
      const status = error.response.status;
      let message = "AI service is currently taking a break. Please try again soon.";
      
      if (status === 503) message = "The recommendation engine is rebooting. One moment!";
      if (status === 504) message = "The AI is thinking too hard — request timed out.";

      toast.error(message, {
        id: "api-dependency-error",
        duration: 5000,
      });
    }

    // 3. Extract and return formatted error
    const apiError = (error.response?.data as any)?.message || error.message;
    return Promise.reject(new Error(apiError));
  }
);

/**
 * Type-safe wrapper around axios methods.
 * Ensures the return type matches the unwrapped data from the interceptor.
 */
const client = {
  get: <T>(url: string, config?: any) => api.get<any, T>(url, config),
  post: <T>(url: string, data?: any, config?: any) => api.post<any, T>(url, data, config),
  put: <T>(url: string, data?: any, config?: any) => api.put<any, T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: any) => api.patch<any, T>(url, data, config),
  delete: <T>(url: string, config?: any) => api.delete<any, T>(url, config),
};

export default client;
export { api as axiosInstance };
