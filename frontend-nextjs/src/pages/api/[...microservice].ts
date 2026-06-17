import type { NextApiRequest, NextApiResponse } from "next";

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || "http://localhost:8001";
const FILE_SERVICE = process.env.FILE_SERVICE_URL || "http://localhost:8002";
const SHARE_SERVICE = process.env.SHARE_SERVICE_URL || "http://localhost:8003";

function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (name) cookies[name] = decodeURIComponent(val);
  });
  return cookies;
}

export const config = {
  api: {
    bodyParser: false, // Turn off body parser to allow raw file uploads
  },
};

// Simple helper to read stream body if needed
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { microservice } = req.query;
  const pathParts = Array.isArray(microservice) ? microservice : [microservice];
  const fullPath = "/" + pathParts.join("/");

  // Determine backend base URL
  let backendBase = "";
  if (pathParts[0] === "auth") {
    backendBase = AUTH_SERVICE;
  } else if (pathParts[0] === "files" || pathParts[0] === "quota") {
    backendBase = FILE_SERVICE;
  } else if (pathParts[0] === "shares" || pathParts[0] === "public") {
    backendBase = SHARE_SERVICE;
  } else {
    return res.status(404).json({ detail: "Service path not found" });
  }

  const cookies = parseCookies(req.headers.cookie);
  let accessToken = cookies["access_token"];
  const refreshToken = cookies["refresh_token"];

  // Helper to construct cookies string for Set-Cookie header
  const makeCookieHeaders = (access: string, refresh?: string) => {
    const headers = [
      `access_token=${access}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900; Secure`,
    ];
    if (refresh) {
      headers.push(
        `refresh_token=${refresh}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure`
      );
    }
    return headers;
  };

  const clearCookieHeaders = [
    `access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ];

  // Read raw request body
  const bodyBuffer = await getRawBody(req);

  // Special Case: Login & Register
  if (pathParts[0] === "auth" && (pathParts[1] === "login" || pathParts[1] === "register")) {
    try {
      const response = await fetch(`${backendBase}/api${fullPath}/`, {
        method: req.method,
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
        },
        body: bodyBuffer,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json(errJson);
      }

      const data = await response.json();
      const { access, refresh, ...rest } = data;

      res.setHeader("Set-Cookie", makeCookieHeaders(access, refresh));
      return res.status(response.status).json(rest);
    } catch (err: any) {
      return res.status(500).json({ detail: err.message || "Failed connecting to auth service" });
    }
  }

  // Special Case: Logout
  if (pathParts[0] === "auth" && pathParts[1] === "logout") {
    if (refreshToken) {
      try {
        await fetch(`${AUTH_SERVICE}/api/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (e) {
        console.error("Auth backend logout failed during proxy:", e);
      }
    }
    res.setHeader("Set-Cookie", clearCookieHeaders);
    return res.status(200).json({ detail: "Successfully logged out." });
  }

  // Function to forward the request
  const forwardRequest = async (token: string | undefined) => {
    const headers: Record<string, string> = {};
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const targetUrl = `${backendBase}/api${fullPath}${fullPath.endsWith("/") ? "" : "/"}`;
    return fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? bodyBuffer : undefined,
    });
  };

  // Internal helper to refresh token
  const doRefresh = async (): Promise<{ access: string; refresh?: string } | null> => {
    if (!refreshToken) return null;
    try {
      const refreshRes = await fetch(`${AUTH_SERVICE}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        return {
          access: refreshData.access,
          refresh: refreshData.refresh,
        };
      }
    } catch (e) {
      console.error("Token refresh failed in proxy:", e);
    }
    return null;
  };

  // Perform request
  try {
    // If no access token but refresh token exists, try refreshing first
    if (!accessToken && refreshToken) {
      const newTokens = await doRefresh();
      if (newTokens) {
        accessToken = newTokens.access;
        res.setHeader("Set-Cookie", makeCookieHeaders(newTokens.access, newTokens.refresh));
      }
    }

    let response = await forwardRequest(accessToken);

    // If 401 Unauthorized, try refreshing access token and retrying once
    if (response.status === 401 && refreshToken) {
      const newTokens = await doRefresh();
      if (newTokens) {
        accessToken = newTokens.access;
        res.setHeader("Set-Cookie", makeCookieHeaders(newTokens.access, newTokens.refresh));
        response = await forwardRequest(accessToken);
      } else {
        // Refresh token failed/expired -> Clear cookies and return 401
        res.setHeader("Set-Cookie", clearCookieHeaders);
        return res.status(401).json({ detail: "Session expired." });
      }
    }

    // Proxy the response headers & body back to frontend
    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    }

    if (contentType && contentType.includes("application/json")) {
      const json = await response.json();
      return res.json(json);
    } else {
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || "Failed connecting to downstream service" });
  }
}
