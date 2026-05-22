import axios from "axios";

export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8001/api",
});

export const fileApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FILE_API_URL || "http://localhost:8002/api",
});

export const shareApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SHARE_API_URL || "http://localhost:8003/api",
});
