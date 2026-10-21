import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getToken } from "./storage";

// Default backend port used by the Express API.
const BACKEND_PORT = 4000;

// Hosts that are safe to reach over plain HTTP during local development.
function isLocalHost(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }
  if (hostname.endsWith(".local")) return true;
  if (hostname.endsWith(".exp.direct") || hostname.endsWith(".expo.dev")) return true;
  return (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

// Allow overriding the backend URL with an env var (e.g. for a deployed build).
// Remote hosts are forced onto HTTPS so auth tokens are never sent in clear
// text; local/dev hosts keep the scheme they were configured with.
function normalizeConfiguredUrl(raw) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" && !isLocalHost(url.hostname)) {
      url.protocol = "https:";
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

const configured =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL
    ? normalizeConfiguredUrl(process.env.EXPO_PUBLIC_API_URL)
    : null;

const expoHostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  Constants.manifest?.debuggerHost;

function getExpoHost() {
  if (!expoHostUri) return null;
  try {
    const host = new URL(
      expoHostUri.includes("://") ? expoHostUri : `http://${expoHostUri}`
    ).hostname;
    if (host.endsWith(".exp.direct") || host.endsWith(".expo.dev")) return null;
    return host;
  } catch {
    return null;
  }
}

// Web shares its host with the backend. On devices, use Expo's LAN host so
// localhost does not accidentally point back at the phone or emulator.
export function resolveApiBaseUrl() {
  if (configured) return configured;
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
  }
  const host = getExpoHost();
  if (host) return `http://${host}:${BACKEND_PORT}`;
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

// Identifies the client platform to the API. Native builds have no Origin
// header, so this lets the backend treat them as the mobile client type.
const CLIENT_TYPE = Platform.OS === "web" ? "web" : "mobile";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "X-Client-Type": CLIENT_TYPE },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;