import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Backend API instance (for non-auth endpoints) ────────────
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ── Auth API instance (Next.js API routes — same domain) ─────
const authAxios = axios.create({
  baseURL: "",  // relative to current domain
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Request interceptor — attach JWT token (both instances)
function attachToken(config: any) {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ncn_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}
api.interceptors.request.use(attachToken);
authAxios.interceptors.request.use(attachToken);

// Response interceptor — auto refresh on 401
function handle401(instance: typeof axios) {
  return async (error: any) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("ncn_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post("/api/auth/refresh", { refreshToken });

        localStorage.setItem("ncn_access_token", data.accessToken);
        localStorage.setItem("ncn_refresh_token", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return instance(original);
      } catch {
        localStorage.removeItem("ncn_access_token");
        localStorage.removeItem("ncn_refresh_token");
        localStorage.removeItem("ncn_user");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  };
}
api.interceptors.response.use((r) => r, handle401(api as any));
authAxios.interceptors.response.use((r) => r, handle401(authAxios as any));

// ── Auth endpoints (Next.js API routes) ─────────────────────
export const authApi = {
  register: (data: { email: string; name: string; password: string; referralCode?: string }) =>
    authAxios.post("/api/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    authAxios.post("/api/auth/login", data).then((r) => r.data),

  logout: () => Promise.resolve({ success: true }),  // client-side only

  me: () => authAxios.get("/api/auth/me").then((r) => r.data),

  refresh: (refreshToken: string) =>
    authAxios.post("/api/auth/refresh", { refreshToken }).then((r) => r.data),
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

// ── Affiliate endpoints ─────────────────────────────────────────
// NOTE: Gọi Next.js API routes thay vì NestJS backend:
//   - NestJS /api/v1/affiliate/* không reachable từ Vercel production
//   - NestJS dùng PostgreSQL, nhưng data thực ở Firestore (SePay webhook)
//   → /api/affiliate/stats và /api/affiliate/commissions đọc thẳng Firestore
export const affiliateApi = {
  getStats:       () => authAxios.get("/api/affiliate/stats").then((r) => r.data),
  getCommissions: (page = 1, limit = 20) =>
    authAxios.get(`/api/affiliate/commissions?page=${page}&limit=${limit}`).then((r) => r.data),
};

// ── Users endpoints ─────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get("/users/profile").then((r) => r.data),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put("/users/profile", data).then((r) => r.data),
};
