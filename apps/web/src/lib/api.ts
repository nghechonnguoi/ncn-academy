import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ncn_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("ncn_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem("ncn_access_token", data.accessToken);
        localStorage.setItem("ncn_refresh_token", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        // Clear tokens and redirect to login
        localStorage.removeItem("ncn_access_token");
        localStorage.removeItem("ncn_refresh_token");
        localStorage.removeItem("ncn_user");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ──────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; name: string; password: string; referralCode?: string }) =>
    api.post("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  me: () => api.get("/auth/me").then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }).then((r) => r.data),
};

// ── Assessment endpoints ────────────────────────────────────
export const assessmentApi = {
  submit: (
    answers: { questionId: string; answer: number | string }[],
    track?: 'university' | 'vocational',
    profile?: Record<string, string>,
  ) =>
    api.post("/assessment/submit", { answers, track, profile }).then((r) => r.data),

  list: () => api.get("/assessment").then((r) => r.data),

  getById: (id: string) => api.get(`/assessment/${id}`).then((r) => r.data),
};

// ── AI endpoints ────────────────────────────────────────────
export const aiApi = {
  chat: (messages: { role: "user" | "assistant"; content: string }[]) =>
    api.post("/ai/chat", { messages }).then((r) => r.data),
};

// ── Payments endpoints ──────────────────────────────────────
export const paymentsApi = {
  createCheckout: (plan: string, affiliateCode?: string) =>
    api.post("/payments/checkout", { plan, affiliateCode }).then((r) => r.data),
};

// ── Affiliate endpoints ─────────────────────────────────────
export const affiliateApi = {
  getStats: () => api.get("/affiliate/stats").then((r) => r.data),
  getCommissions: () => api.get("/affiliate/commissions").then((r) => r.data),
};

// ── Users endpoints ─────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get("/users/profile").then((r) => r.data),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put("/users/profile", data).then((r) => r.data),
};
