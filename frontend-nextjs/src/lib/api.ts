const AUTH = "/api";
const FILE = "/api";
const SHARE = "/api";

const LOGGED_IN_KEY = "cloudvault_logged_in";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(LOGGED_IN_KEY)),
  getRefresh: () => null,
  set: (access: string, refresh?: string) => {
    localStorage.setItem(LOGGED_IN_KEY, "true");
  },
  clear: () => {
    localStorage.removeItem(LOGGED_IN_KEY);
  },
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

  const res = await fetch(`${base}${path}`, { ...opts, headers });
  if (!res.ok) {
    if (res.status === 401 && !path.includes("/auth/login/")) {
      tokenStore.clear();
      if (typeof window !== "undefined") {
        const theme = localStorage.getItem("cloudvault_theme");
        localStorage.clear();
        sessionStorage.clear();
        if (theme) localStorage.setItem("cloudvault_theme", theme);
        window.location.replace("/login?expired=1");
        return undefined as any;
      }
    }
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
  login: (username: string, password: string) =>
    request<{ access: string; refresh: string }>(AUTH, "/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      tokenStore.set("true");
      return res;
    }),
  register: (username: string, email: string, password: string) =>
    request(AUTH, "/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }).then((res) => {
      tokenStore.set("true");
      return res;
    }),
  me: () => request<UserProfile>(AUTH, "/auth/profile/"),
  logout: async () => {
    try {
      await request(AUTH, "/auth/logout/", {
        method: "POST",
      });
    } catch (e) {
      console.error("Backend logout failed:", e);
    }
    tokenStore.clear();
    if (typeof window !== "undefined") {
      const theme = localStorage.getItem("cloudvault_theme");
      localStorage.clear();
      sessionStorage.clear();
      if (theme) localStorage.setItem("cloudvault_theme", theme);
      window.location.replace("/login");
    }
  },
};

/* ── File API ── */
export interface CloudFile {
  id: string;
  owner_id?: number;
  original_name: string;
  name?: string;
  blob_name?: string;
  thumb_name?: string | null;
  content_type?: string;
  size: number;
  created_at?: string;
  album_id?: number | null;
  url?: string;
}

export const fileApi = {
  list: () =>
    request<{ count: number; results: CloudFile[] }>(FILE, "/files/").then(
      (res) => (Array.isArray(res) ? res : res.results ?? [])
    ),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<CloudFile>(FILE, "/files/upload/", { method: "POST", body: fd });
  },
  remove: (id: string) => request(FILE, `/files/${id}/delete/`, { method: "DELETE" }),
  quota: () =>
    request<{ used_bytes: number; limit_bytes: number }>(FILE, "/quota/").then((res) => ({
      used: res.used_bytes,
      total: res.limit_bytes,
    })),
  previewUrl: async (file: CloudFile) => {
    const preferredPath = file.thumb_name
      ? `/files/${file.id}/thumbnail/`
      : `/files/${file.id}/download/`;

    let res = await fetch(`${FILE}${preferredPath}`);
    if (!res.ok && file.thumb_name) {
      res = await fetch(`${FILE}/files/${file.id}/download/`);
    }
    if (!res.ok) throw new Error(`Cannot load preview for ${file.original_name}`);

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
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
  list: () => request<ShareLink[]>(SHARE, "/shares/"),
  create: (fileId: string | number, expiresAt?: string | null) =>
    request<ShareLink>(SHARE, "/shares/create/", {
      method: "POST",
      body: JSON.stringify({ file_id: Number(fileId), expires_at: expiresAt ?? null, is_active: true }),
    }),
  update: (token: string, data: Partial<Pick<ShareLink, "is_active" | "expires_at">>) =>
    request<ShareLink>(SHARE, `/shares/${token}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (token: string) =>
    request(SHARE, `/shares/${token}/delete/`, { method: "DELETE" }),
  publicShare: (token: string) => request<ShareLink>(SHARE, `/public/${token}/`),
};
