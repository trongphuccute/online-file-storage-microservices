const AUTH = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8001/api";
const FILE = process.env.NEXT_PUBLIC_FILE_API_URL || "http://localhost:8002/api";
const SHARE = process.env.NEXT_PUBLIC_SHARE_API_URL || "http://localhost:8003/api";

const TOKEN_KEY = "cloudvault_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T = any>(
  base: string,
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers = new Headers(opts.headers);
  if (!headers.has("Content-Type") && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${base}${path}`, { ...opts, headers });
  if (!res.ok) {
    // Django trả lỗi dạng JSON: { "username": ["already exists"], "detail": "..." }
    try {
      const json = await res.json();
      const msg = Object.entries(json)
        .map(([field, msgs]) => {
          const text = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
          return field === "detail" ? text : `${field}: ${text}`;
        })
        .join(" | ");
      throw new Error(msg || `HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== `HTTP ${res.status}`) throw e;
      const text = await res.text().catch(() => res.statusText);
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  if (res.status === 204) return undefined as any;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : ((await res.text()) as any);
}

/* ── Auth API ── */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  date_joined?: string;
}

export const authApi = {
  // POST /auth/login/ { username, password } → { access, refresh }
  login: (username: string, password: string) =>
    request<{ access: string; refresh: string }>(AUTH, "/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  // POST /auth/register/ { username, email, password }
  register: (username: string, email: string, password: string) =>
    request(AUTH, "/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  // GET /auth/profile/ (Bearer token)
  me: () => request<UserProfile>(AUTH, "/auth/profile/"),
};

/* ── File API ── */
export interface CloudFile {
  id: string;
  name: string;
  size: number;
  url?: string;
  created_at?: string;
}

export const fileApi = {
  list: () => request<CloudFile[]>(FILE, "/files/"),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<CloudFile>(FILE, "/files/upload/", { method: "POST", body: fd });
  },
  remove: (id: string) => request(FILE, `/files/${id}/`, { method: "DELETE" }),
  quota: () => request<{ used: number; total: number }>(FILE, "/quota/"),
};

/* ── Share API ── */
export interface ShareLink {
  id: string;
  token: string;
  file_id: number;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  file_info?: {
    id: string | number;
    original_name: string;
    content_type: string;
    size: number;
    created_at: string;
    url: string;
  };
}

export const shareApi = {
  // GET /shares/
  list: () => request<ShareLink[]>(SHARE, "/shares/"),
  // POST /shares/create/ { file_id, expires_at, is_active }
  create: (fileId: string | number, expiresAt?: string | null) =>
    request<ShareLink>(SHARE, "/shares/create/", {
      method: "POST",
      body: JSON.stringify({ file_id: Number(fileId), expires_at: expiresAt ?? null, is_active: true }),
    }),
  // PATCH /shares/<token>/ { is_active?, expires_at? }
  update: (token: string, data: Partial<Pick<ShareLink, "is_active" | "expires_at">>) =>
    request<ShareLink>(SHARE, `/shares/${token}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  // DELETE /shares/<token>/delete/
  remove: (token: string) =>
    request(SHARE, `/shares/${token}/delete/`, { method: "DELETE" }),
  // GET /public/<token>/ (no auth needed)
  publicShare: (token: string) => request<ShareLink>(SHARE, `/public/${token}/`),
};