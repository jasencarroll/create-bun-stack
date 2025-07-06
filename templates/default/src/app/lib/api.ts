// API client with CSRF support

class ApiClient {
  private csrfToken: string | null = null;

  constructor() {
    // Initialize CSRF token from storage if available
    this.csrfToken = localStorage.getItem("csrfToken");
  }

  private getHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    if (this.csrfToken) {
      headers["X-CSRF-Token"] = this.csrfToken;
    }

    return headers;
  }

  async request<T>(url: string, options: RequestInit = {}, includeAuth = true): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
      credentials: "include", // Important for CSRF cookies
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({ error: "Request failed" }))) as {
        error?: string;
      };
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    const data = (await response.json()) as T & { csrfToken?: string };

    // Update CSRF token if provided in response
    if (data.csrfToken) {
      this.csrfToken = data.csrfToken;
      localStorage.setItem("csrfToken", data.csrfToken);
    }

    return data as T;
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(url: string, body: unknown, includeAuth = true): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      includeAuth
    );
  }

  async put<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }

  clearTokens() {
    this.csrfToken = null;
    localStorage.removeItem("csrfToken");
    localStorage.removeItem("token");
  }
}

export const apiClient = new ApiClient();
