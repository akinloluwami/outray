import axios from "axios";

const apiClient = axios.create({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Tunnel {
  id: string;
  url: string;
  userId: string;
  name: string | null;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  id: string;
  userId: string;
  token: string;
  name: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface Subdomain {
  id: string;
  subdomain: string;
  organizationId: string;
  userId: string;
  createdAt: Date;
}

interface CreateAuthTokenParams {
  name: string;
}

interface DeleteAuthTokenParams {
  id: string;
}

type SuccessResponse<T> = T;
type ErrorResponse = { error: string; details?: string };
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Helper function to handle API calls with consistent error handling
async function apiCall<T = any>(
  method: "get" | "post" | "patch" | "delete",
  url: string,
  options?: { params?: any; data?: any },
): Promise<ApiResponse<T>> {
  try {
    let response;
    if (method === "get" || method === "delete") {
      response = await apiClient[method](url, {
        params: options?.params,
        data: options?.data,
      });
    } else {
      response = await apiClient[method](url, options?.data, {
        params: options?.params,
      });
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return { error: "An unexpected error occurred" };
  }
}

export const appClient = {
  tunnels: {
    list: async (organizationId: string) =>
      apiCall<{ tunnels: Tunnel[] }>("get", "/api/tunnels", {
        params: { organizationId },
      }),

    get: async (tunnelId: string) =>
      apiCall<{ tunnel: Tunnel }>("get", `/api/tunnels/${tunnelId}`),

    delete: async (tunnelId: string) =>
      apiCall<{ message: string }>("delete", `/api/tunnels/${tunnelId}`),
  },

  authTokens: {
    list: async () =>
      apiCall<{ tokens: AuthToken[] }>("get", "/api/auth-tokens"),

    create: async (params: CreateAuthTokenParams) =>
      apiCall<{ token: AuthToken }>("post", "/api/auth-tokens", {
        data: params,
      }),

    delete: async (params: DeleteAuthTokenParams) =>
      apiCall<{ success: boolean }>("delete", "/api/auth-tokens", {
        data: params,
      }),
  },

  subdomains: {
    list: async (organizationId: string) =>
      apiCall<{ subdomains: Subdomain[] }>("get", "/api/subdomains", {
        params: { organizationId },
      }),

    create: async (params: { subdomain: string; organizationId: string }) =>
      apiCall<{ subdomain: Subdomain }>("post", "/api/subdomains", {
        data: params,
      }),

    delete: async (id: string) =>
      apiCall<{ success: boolean }>("delete", `/api/subdomains/${id}`),
  },
};
