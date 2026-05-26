const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers = new Headers(options.headers || {});
    
    // Auto inject bearer token
    if (this.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Attempt token refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry request with new token
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        const retryResponse = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
        });
        return this.handleResponse(retryResponse);
      } else {
        this.clearTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
    }

    return this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  private async refreshToken(): Promise<boolean> {
    const rToken = localStorage.getItem('refresh_token');
    if (!rToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('access_token', data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async register(body: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async verifyOtp(body: any) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(body: any) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async logout() {
    this.clearTokens();
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Tickets
  async getTickets(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/tickets${query ? `?${query}` : ''}`);
  }

  async getTicket(id: string) {
    return this.request(`/tickets/${id}`);
  }

  async createTicket(body: any) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateTicket(id: string, body: any) {
    return this.request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async addMessage(ticketId: string, body: any) {
    return this.request(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // File Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/files/upload', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
