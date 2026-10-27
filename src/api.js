import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("shopsphere_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem("shopsphere_refresh");
    if (error.response?.status === 401 && refresh && !original?._retried && !original?.url?.includes("/auth/")) {
      original._retried = true;
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh });
        localStorage.setItem("shopsphere_access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("shopsphere_access");
        localStorage.removeItem("shopsphere_refresh");
      }
    }
    return Promise.reject(error);
  },
);

export function apiError(error) {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === "string") return data.detail;
    const first = Object.values(data).flat(Infinity).find((value) => typeof value === "string");
    if (first) return first;
  }
  return error.code === "ECONNABORTED"
    ? "The request took too long. Please try again."
    : "We couldn't reach the store. Check that the ShopSphere API is running and try again.";
}

export const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

export default api;
