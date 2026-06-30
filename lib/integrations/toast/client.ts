import { getToastConfig, isToastApiConfigured } from "@/lib/integrations/toast/config";

type ToastAuthResponse = {
  token: { accessToken: string; expiresIn: number };
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export class ToastApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "ToastApiError";
    this.status = status;
    this.body = body;
  }
}

export async function getToastAccessToken(forceRefresh = false) {
  if (!isToastApiConfigured()) {
    throw new Error("Toast API credentials are not configured.");
  }

  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const config = getToastConfig();
  const response = await fetch(`${config.apiBaseUrl}/authentication/v1/authentication/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      userAccessType: "TOAST_MACHINE_CLIENT"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ToastApiError("Toast authentication failed.", response.status, body);
  }

  const payload = (await response.json()) as ToastAuthResponse;
  cachedToken = {
    value: payload.token.accessToken,
    expiresAt: Date.now() + payload.token.expiresIn * 1000
  };
  return cachedToken.value;
}

export async function toastRequest<T>(
  path: string,
  init: RequestInit & { baseUrl?: string; restaurantScoped?: boolean } = {}
): Promise<T> {
  const config = getToastConfig();
  const token = await getToastAccessToken();
  const baseUrl = init.baseUrl || config.apiBaseUrl;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  if (init.restaurantScoped !== false) {
    headers.set("Toast-Restaurant-External-ID", config.restaurantExternalId);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ToastApiError(`Toast API request failed: ${path}`, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function resetToastTokenCache() {
  cachedToken = null;
}
