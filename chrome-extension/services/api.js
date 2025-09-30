import config from "../config.js";

class ApiService {
  constructor() {
    this.baseURL = config.apiBaseUrl;
  }

  async getToken() {
    return localStorage.getItem("authToken");
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `HTTP error! status: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async generateEnhancedPrompt(userInput) {
    return this.request("/generate", {
      method: "POST",
      body: JSON.stringify({ userInput }),
    });
  }

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (response.token) {
      localStorage.setItem("authToken", response.token);
    }
    return response;
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    localStorage.removeItem("authToken");
  }
}

export default new ApiService();
