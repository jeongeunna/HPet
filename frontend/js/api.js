/**
 * HPet - Frontend API Module
 * Handles all backend HTTP requests, authentication tokens, and common error logic.
 */

class HPetAPI {
  constructor() {
    // 백엔드 기본 URL (로컬 테스트용)
    this.BASE_URL = 'http://localhost:8080/api';
  }

  // 로컬 스토리지에서 토큰 가져오기
  getAccessToken() {
    return localStorage.getItem('hpet_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('hpet_refresh_token');
  }

  // 토큰 저장
  setTokens(accessToken, refreshToken) {
    if (accessToken && accessToken !== 'undefined') localStorage.setItem('hpet_access_token', accessToken);
    if (refreshToken && refreshToken !== 'undefined') localStorage.setItem('hpet_refresh_token', refreshToken);
  }

  // 로그아웃 처리 (토큰 삭제 및 홈 화면 이동)
  clearTokens() {
    localStorage.removeItem('hpet_access_token');
    localStorage.removeItem('hpet_refresh_token');
  }

  // 공통 Fetch 래퍼 (토큰 주입 및 에러 처리)
  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    // 헤더 기본 설정
    const headers = new Headers(options.headers || {});
    
    // FormData가 아닌 경우에만 Content-Type을 application/json으로 설정
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config = {
      ...options,
      headers
    };

    try {
      let response = await fetch(url, config);

      // 401 Unauthorized (토큰 만료 등) 발생 시 재발급 시도 로직
      if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/reissue')) {
        const refreshed = await this.reissueToken();
        if (refreshed) {
          // 재발급 성공 시 헤더 업데이트 후 재요청
          headers.set('Authorization', `Bearer ${this.getAccessToken()}`);
          response = await fetch(url, config);
        } else {
          // 재발급 실패 시 로그아웃 처리
          this.clearTokens();
          if (window.hpetRouter) {
            window.hpetStore.state.user.isLoggedIn = false;
            window.hpetRouter.navigateTo('auth');
          }
          throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
        }
      }

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch(e) {}
        
        let errorMsg = `API Error: ${response.status}`;
        if (errData && errData.error && errData.error.message) {
          errorMsg = errData.error.message;
        } else if (errData && errData.message) {
          errorMsg = errData.message;
        }
        
        throw new Error(errorMsg);
      }

      // 응답 본문이 없는 경우(204 No Content 등) 대비
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        if (json.success === false) {
          throw new Error(json.error?.message || "API Error");
        }
        return json.data !== undefined ? json.data : json;
      }
      return null;

    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      throw error;
    }
  }

  // 토큰 재발급 요청
  async reissueToken() {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/reissue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.getRefreshToken() })
      });
      if (response.ok) {
        const resJson = await response.json();
        const data = resJson.data !== undefined ? resJson.data : resJson;
        if (data && data.accessToken) {
          this.setTokens(data.accessToken, data.refreshToken);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ==========================================
  // Auth API
  // ==========================================
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async signup(email, password) {
    return await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async sendEmailCode(email) {
    return await this.request('/auth/email-verification/send', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async verifyEmailCode(email, code) {
    return await this.request('/auth/email-verification/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
  }

  async resetPassword(email) {
    return await this.request('/auth/password-reset/send', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getMyInfo() {
    return await this.request('/users/me', { method: 'GET' });
  }

  async submitAgreements(agreements) {
    return await this.request('/users/me/agreements', {
      method: 'POST',
      body: JSON.stringify(agreements)
    });
  }

  async registerDeviceToken(token) {
    return await this.request('/device-tokens', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // ==========================================
  // Profile & Recommendations API
  // ==========================================
  async saveProfile(profileData) {
    return await this.request('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  async getRecommendations() {
    return await this.request('/profile/recommendations', { method: 'GET' });
  }

  // ==========================================
  // Supplement Management API
  // ==========================================
  async addSupplement(supplementIds) {
    return await this.request('/users/me/supplements', {
      method: 'POST',
      body: JSON.stringify({ supplementIds })
    });
  }

  async removeSupplement(id) {
    return await this.request(`/users/me/supplements/${id}`, { method: 'DELETE' });
  }

  async searchSupplements(keyword) {
    return await this.request(`/supplements?keyword=${encodeURIComponent(keyword)}`, { method: 'GET' });
  }

  // ==========================================
  // Character API
  // ==========================================
  async getMyCharacter() {
    return await this.request('/character/me', { method: 'GET' });
  }

  async equipCharacterItem(itemId) {
    return await this.request('/character/me/items', {
      method: 'PUT',
      body: JSON.stringify({ itemId })
    });
  }

  // ==========================================
  // Dashboard API
  // ==========================================
  async getHomeSummary() {
    return await this.request('/home/summary', { method: 'GET' });
  }

  // ==========================================
  // Dose Verification API
  // ==========================================
  async verifyDosePhoto(supplementId, imageBlob) {
    const formData = new FormData();
    formData.append('userSupplementId', supplementId);
    formData.append('photo', imageBlob, 'capture.png');

    return await this.request('/dose-verification/photo', {
      method: 'POST',
      body: formData // Content-Type은 request 내부에서 자동으로 multipart/form-data로 세팅됨 (브라우저가 boundary 추가)
    });
  }

  async checkDoseStatus(supplementId) {
    return await this.request(`/dose-verification/status?userSupplementId=${supplementId}`, { method: 'GET' });
  }

  async manualDoseCheck(supplementId) {
    return await this.request('/dose-records', {
      method: 'POST',
      body: JSON.stringify({ userSupplementId: supplementId })
    });
  }

  // ==========================================
  // Posture Game API
  // ==========================================
  async sendPostureEvents(eventsData) {
    return await this.request('/posture-events', {
      method: 'POST',
      body: JSON.stringify(eventsData)
    });
  }

  // ==========================================
  // History API
  // ==========================================
  async getDoseRecords(monthStr) {
    // monthStr: YYYY-MM
    const date = new Date(`${monthStr}-01`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    return await this.request(`/dose-records?startDate=${startDate}&endDate=${endDate}`, { method: 'GET' });
  }

  async getPostureSummary(monthStr) {
    const date = new Date(`${monthStr}-01`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return await this.request(`/posture-events/summary?startDate=${startDate}&endDate=${endDate}`, { method: 'GET' });
  }

  // ==========================================
  // Notification API
  // ==========================================
  async getAlarms() {
    return await this.request('/notifications', { method: 'GET' });
  }

  async saveAlarm(alarmData) {
    return await this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(alarmData)
    });
  }
}

// 전역 인스턴스 생성
window.hpetApi = new HPetAPI();
