/**
 * HPet - Client Core Application & State Management Engine (Stage 1)
 */

// ==========================================================================
// 1. Storage & State Management System
// ==========================================================================
class HPetStore {
  // 캐릭터 이미지 목록 (백엔드 연동 전 프론트 임시 배정용)
  static CHAR_IMAGES = [
    { id: 'chick', name: '병아리', file: 'char_chick.png' },
    { id: 'hedgehog', name: '고슴도치', file: 'char_hedgehog.png' },
    { id: 'otter', name: '수달이', file: 'char_otter.png' },
    { id: 'turtle', name: '거북이', file: 'char_turtle.png' }
  ];

  constructor() {
    this.STORAGE_KEY = 'HPET_APP_STATE_V1';
    this.state = this.loadState();
  }

  // 랜덤 캐릭터 배정 (백엔드 연동 전 임시 로직 — 추후 서버에서 받은 값으로 교체)
  assignRandomChar() {
    const chars = HPetStore.CHAR_IMAGES;
    const chosen = chars[Math.floor(Math.random() * chars.length)];
    this.state.pet.charId = chosen.id;
    this.state.pet.charImage = chosen.file;
    this.state.pet.name = chosen.name;
    this.saveState();
    return chosen;
  }

  getInitialState() {
    return {
      user: {
        isLoggedIn: false,
        name: '김하늘',
        email: 'sky@hpet.io',
        ageGroup: '20s',
        gender: 'female',
        concerns: ['fatigue', 'turtle-neck'],
        streak: 3
      },
      pet: {
        id: 'pet_default',
        name: '병아리',
        charId: 'chick',
        charImage: 'char_chick.png',  // 기본값, 로그인 시 랜덤 배정됨
        type: 'character',
        level: 2,
        exp: 68,
        maxExp: 100,
        postureHealth: 85,
        happiness: 80,
        stage: 'teen' // baby, teen, adult
      },
      supplements: [
        { id: 'supp_1', name: '비타민 C', time: '08:00 AM', takenToday: true, icon: 'C' },
        { id: 'supp_2', name: '비타민 D', time: '12:00 PM', takenToday: false, icon: 'D' },
        { id: 'supp_3', name: '아연 (Zinc)', time: '06:00 PM', takenToday: false, icon: 'Zn' },
        { id: 'supp_4', name: '프로바이오틱스', time: '09:00 PM', takenToday: false, icon: 'Pro' }
      ],
      history: {
        '2026-07-29': { supplements: true, turtleCount: 1 },
        '2026-07-30': { supplements: true, turtleCount: 0 },
        '2026-07-31': { supplements: false, turtleCount: 2 }
      },
      stats: {
        turtleNeckDetectionsThisWeek: 4,
        postureGamesCleared: 12
      }
    };
  }

  loadState() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    let state;
    if (!saved) {
      state = this.getInitialState();
    } else {
      try {
        state = JSON.parse(saved);
      } catch (e) {
        console.error('State parse error, fallback to initial state', e);
        state = this.getInitialState();
      }
    }

    // 테스트를 위한 8월 가상 데이터 강제 주입
    if (!state.history['2026-08-01']) {
      state.history['2026-08-01'] = { supplements: true, turtleCount: 1 };
      state.history['2026-08-05'] = { supplements: true, turtleCount: 0 };

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      state.history[todayStr] = { supplements: true, turtleCount: 3 }; // 오늘 날짜에도 데이터 주입

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    return state;
  }

  saveState() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    window.dispatchEvent(new CustomEvent('hpet_state_changed', { detail: this.state }));
  }

  updatePetExp(amount) {
    this.state.pet.exp += amount;
    if (this.state.pet.exp >= this.state.pet.maxExp) {
      this.state.pet.exp -= this.state.pet.maxExp;
      this.state.pet.level += 1;
    }
    this.saveState();
  }

  updatePostureHealth(amount) {
    this.state.pet.postureHealth = Math.min(100, Math.max(0, this.state.pet.postureHealth + amount));
    this.saveState();
  }

  markSupplementTaken(suppId) {
    const supp = this.state.supplements.find(s => s.id === suppId);
    if (supp) {
      supp.takenToday = true;
      this.updatePetExp(20);
    }
  }
}

// Global App Store instance
window.hpetStore = new HPetStore();

// ==========================================================================
// 2. Retro Sound Engine (Web Audio API Beeps)
// ==========================================================================
class HPetSound {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playBeep(freq = 440, duration = 0.08, type = 'sine') {
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Silently ignore audio block
    }
  }

  playSuccess() {
    this.playBeep(523.25, 0.08); // C5
    setTimeout(() => this.playBeep(659.25, 0.08), 80); // E5
    setTimeout(() => this.playBeep(783.99, 0.15), 160); // G5
  }
}

window.hpetSound = new HPetSound();

// ==========================================================================
// 3. Router & View Management
// ==========================================================================
class HPetRouter {
  constructor() {
    this.views = {
      auth: document.getElementById('view-auth'),
      profileSetup: document.getElementById('view-profile-setup'),
      dashboard: document.getElementById('view-dashboard'),
      cameraAuth: document.getElementById('view-camera-auth'),
      postureGame: document.getElementById('view-posture-game'),
      history: document.getElementById('view-history'),
      profile: document.getElementById('view-profile')
    };

    this.nav = document.getElementById('app-nav');
    this.header = document.getElementById('main-header');
    this.currentView = 'auth';
  }

  navigateTo(viewName) {
    if (!this.views[viewName]) return;

    window.hpetSound.playBeep(600, 0.05);

    // 이전 뷰의 leave 이벤트 발행 (카메라 스트림 정리 등)
    const prevView = this.currentView;
    if (prevView) {
      window.dispatchEvent(new CustomEvent(`hpet_view_leave_${prevView}`));
    }

    Object.keys(this.views).forEach(key => {
      this.views[key].classList.add('hidden');
      this.views[key].classList.remove('active');
    });

    this.views[viewName].classList.remove('hidden');
    this.views[viewName].classList.add('active');
    this.currentView = viewName;

    // Header & Bottom Nav visibility logic
    if (viewName === 'auth' || viewName === 'cameraAuth' || viewName === 'postureGame') {
      if (this.header) this.header.classList.add('hidden');
      this.nav.classList.add('hidden');
    } else if (viewName === 'profileSetup') {
      if (this.header) this.header.classList.add('hidden');
      this.nav.classList.add('hidden');
    } else if (viewName === 'profile') {
      if (this.header) this.header.classList.add('hidden');
      this.nav.classList.remove('hidden');
    } else {
      if (this.header) this.header.classList.remove('hidden');
      this.nav.classList.remove('hidden');
    }

    // Update bottom nav icons
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 새 뷰의 enter 이벤트 발행 (카메라 시작 등)
    window.dispatchEvent(new CustomEvent(`hpet_view_enter_${viewName}`));

    // View specific init triggers
    if (viewName === 'dashboard') {
      if (window.hpetDashboard) window.hpetDashboard.render();
    } else if (viewName === 'history') {
      if (window.hpetHistory) window.hpetHistory.render();
    }
  }
}

window.hpetRouter = new HPetRouter();

// ==========================================================================
// 4. UI Controller & Renderer
// ==========================================================================
const HPetUI = {
  init() {
    this.bindEvents();
    this.checkInitialSession();
  },

  async checkInitialSession() {
    const token = window.hpetApi.getAccessToken();
    if (token) {
      try {
        const me = await window.hpetApi.getMyInfo();
        window.hpetStore.state.user.isLoggedIn = true;
        if (me && me.name) {
          window.hpetStore.state.user.name = me.name;
        }
        window.hpetRouter.navigateTo('dashboard');
      } catch (err) {
        window.hpetApi.clearTokens();
        window.hpetStore.state.user.isLoggedIn = false;
        window.hpetRouter.navigateTo('auth');
      }
    } else {
      window.hpetStore.state.user.isLoggedIn = false;
      window.hpetRouter.navigateTo('auth');
    }
  },

  bindEvents() {
    // Auth Tab Switch
    document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        if (tab === 'login') {
          document.getElementById('login-container').classList.remove('hidden');
          document.getElementById('signup-container').classList.add('hidden');
        } else {
          document.getElementById('login-container').classList.add('hidden');
          document.getElementById('signup-container').classList.remove('hidden');
        }
      });
    });

    // Form Submissions
    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pw = document.getElementById('login-password').value;

      try {
        await window.hpetApi.login(email, pw);
        const me = await window.hpetApi.getMyInfo();

        window.hpetStore.state.user.isLoggedIn = true;
        if (me && me.name) {
          window.hpetStore.state.user.name = me.name;
        }
        window.hpetStore.saveState();
        window.hpetSound.playSuccess();
        window.hpetRouter.navigateTo('dashboard');
      } catch (err) {
        alert("로그인 실패: " + err.message);
      }
    });

    document.getElementById('form-signup').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const pw = document.getElementById('signup-password').value;
      const pwConfirm = document.getElementById('signup-password-confirm').value;

      if (pw !== pwConfirm) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      // Check terms agreement
      const termsAgreed = document.getElementById('signup-terms').checked;
      if (!termsAgreed) {
        alert("이용약관 및 개인정보 처리방침에 동의해주세요.");
        return;
      }

      try {
        await window.hpetApi.signup(email, pw);
        
        // 가입 성공 시 자동 로그인
        await window.hpetApi.login(email, pw);
        
        const me = await window.hpetApi.getMyInfo();
        if (me) {
          window.hpetStore.state.user.name = me.name || '';
        }
        window.hpetStore.saveState();
        
        // 약관 동의 이력 전송 (로그인 토큰을 얻은 후 전송)
        if (window.hpetApi.submitAgreements) {
          try {
            await window.hpetApi.submitAgreements([
              { type: 'TERMS_OF_SERVICE', version: '1.0', agreed: termsAgreed },
              { type: 'PRIVACY_POLICY', version: '1.0', agreed: termsAgreed },
              { type: 'HEALTH_INFO_COLLECTION', version: '1.0', agreed: termsAgreed }
            ]);
          } catch(e) { console.warn('Agreement submit failed', e); }
        }

        window.hpetSound.playSuccess();
        
        // 회원가입 완료 후 바로 온보딩 화면(profileSetup)으로 진입!
        window.hpetRouter.navigateTo('profileSetup');
        
        // 폼 초기화 (다음에 돌아왔을 때를 대비)
        document.getElementById('form-signup').reset();
        
      } catch (err) {
        alert("회원가입 실패: " + err.message);
      }
    });

    // Settings Button
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        window.hpetRouter.navigateTo('profile');
      });
    }

    // Profile Setup Chips
    document.querySelectorAll('.chip-group:not(.multi) .chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const parent = e.target.parentElement;
        parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    document.querySelectorAll('.chip-group.multi .chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.target.classList.toggle('active');
      });
    });

    // Profile Setup Steps Navigation
    document.getElementById('btn-next-step-1')?.addEventListener('click', async () => {
      // API 통신: 프로필 저장
      try {
        const setup = window.hpetProfileSetup || {};
        await window.hpetApi.saveProfile({
          ageGroup: setup.selectedAge || '20s',
          gender: setup.selectedGender || 'female',
          concerns: setup.selectedConcerns || []
        });
      } catch (err) {
        console.error("프로필 저장 실패", err);
      }

      document.getElementById('setup-step-1').classList.add('hidden');
      document.getElementById('setup-step-2').classList.remove('hidden');
      this.renderRecommendations();
    });

    document.getElementById('btn-next-step-2')?.addEventListener('click', async () => {
      // 선택된 영양제 목록 취합해서 서버에 등록
      const selectedCards = document.querySelectorAll('#recommend-list .recommend-card.selected');
      const suppNames = [];
      selectedCards.forEach(card => {
        const name = card.querySelector('.supp-name')?.textContent;
        if (name) {
          suppNames.push(name.trim());
        }
      });

      try {
        const masterSupps = await window.hpetApi.searchSupplements('');
        const idsToRegister = [];
        suppNames.forEach(name => {
          const found = masterSupps.find(s => s.name === name);
          if (found) idsToRegister.push(found.id);
        });

        if (idsToRegister.length > 0) {
          await window.hpetApi.addSupplement(idsToRegister);
        }
      } catch (err) {
        console.error("영양제 등록 실패", err);
      }

      document.getElementById('setup-step-2').classList.add('hidden');
      document.getElementById('setup-step-3').classList.remove('hidden');
      this.renderPetOptions();
    });

    document.getElementById('btn-finish-setup')?.addEventListener('click', () => {
      window.hpetStore.saveState();
      window.hpetSound.playSuccess();
      window.hpetRouter.navigateTo('dashboard');
    });

    // Navigation Bar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const targetView = e.currentTarget.dataset.view;
        window.hpetRouter.navigateTo(targetView);
      });
    });

    // Global State Sync
    window.addEventListener('hpet_state_changed', (e) => {
      const state = e.detail;
      if (state && state.user && state.user.name) {
        const headerName = document.getElementById('header-username');
        if (headerName) headerName.textContent = `${state.user.name}님`;

        const profileNameDisplay = document.getElementById('profile-name-display');
        if (profileNameDisplay) profileNameDisplay.textContent = `${state.user.name}님`;
      }
    });

    // Quick Action Card Links
    document.getElementById('btn-action-auth')?.addEventListener('click', () => {
      window.hpetRouter.navigateTo('cameraAuth');
    });

    document.getElementById('btn-action-posture')?.addEventListener('click', () => {
      window.hpetRouter.navigateTo('postureGame');
    });

    const btnPostureGame = document.getElementById('btn-posture-game');
    if (btnPostureGame) {
      btnPostureGame.addEventListener('click', () => {
        window.hpetRouter.navigateTo('postureGame');
      });
    }

    document.getElementById('btn-action-game')?.addEventListener('click', () => {
      window.hpetRouter.navigateTo('postureGame');
    });

    document.getElementById('btn-close-cam')?.addEventListener('click', () => {
      window.hpetRouter.navigateTo('dashboard');
    });

    document.getElementById('btn-close-game')?.addEventListener('click', () => {
      window.hpetRouter.navigateTo('dashboard');
    });

    // Pet Interactions
    document.getElementById('tamagotchi-pet-wrapper')?.addEventListener('click', () => {
      window.hpetSound.playBeep(880, 0.1);
      const bubble = document.getElementById('pet-speech');
      const messages = ["기분이 너무 좋아요! 💕", "오늘 영양제 먹으셨나요?", "바른 자세를 유지해봐요!"];
      bubble.textContent = messages[Math.floor(Math.random() * messages.length)];
    });

    // Physical Decorator Buttons
    document.getElementById('tamagotchi-phy-a')?.addEventListener('click', () => {
      window.hpetSound.playBeep(400, 0.06);
    });
    document.getElementById('tamagotchi-phy-b')?.addEventListener('click', () => {
      window.hpetSound.playBeep(600, 0.06);
    });
    document.getElementById('tamagotchi-phy-c')?.addEventListener('click', () => {
      window.hpetSound.playBeep(800, 0.06);
    });

    // 비밀번호 표시/숨김 토글 (Pill & Pose 눈 아이콘)
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const input = e.currentTarget.parentElement.querySelector('input');
        const icon = e.currentTarget.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'fa-solid fa-eye';
        } else {
          input.type = 'password';
          icon.className = 'fa-solid fa-eye-slash';
        }
      });
    });

    // 하단 전환 링크 (Pill & Pose: "이미 계정이 있으신가요? 로그인")
    document.querySelectorAll('.tab-btn-switch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = e.target.dataset.tab;
        // 기존 탭 버튼도 동기화
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.auth-tabs .tab-btn[data-tab="${tab}"]`)?.classList.add('active');

        if (tab === 'login') {
          document.getElementById('login-container').classList.remove('hidden');
          document.getElementById('signup-container').classList.add('hidden');
        } else {
          document.getElementById('login-container').classList.add('hidden');
          document.getElementById('signup-container').classList.remove('hidden');
        }
      });
    });

    // 상단 뒤로가기 버튼
    document.querySelectorAll('.retro-back-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // 회원가입 창에서 뒤로가기 누르면 로그인 창으로 복귀
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('signup-container').classList.add('hidden');
      });
    });

    // Reward Modal Close
    document.getElementById('btn-close-reward')?.addEventListener('click', () => {
      document.getElementById('modal-reward').classList.add('hidden');
    });
  },

  async renderRecommendations() {
    const container = document.getElementById('recommend-list');
    if (!container) return;

    let items = [];
    try {
      items = await window.hpetApi.getRecommendations();
      // 만약 배열이 아니거나 비어있으면 기본값 fallback
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("No items");
      }
    } catch (err) {
      console.warn("추천 API 연동 실패, 기본 데이터 사용", err);
      items = [
        { name: '비타민 C', reason: '피로 회복 & 항산화 케어 추천', icon: '🍋' },
        { name: '오메가 3', reason: '눈 피로 및 혈행 개선 추천', icon: '🐟' },
        { name: '마그네슘', reason: '근육 이완 및 거북목 통증 완화', icon: '⚡' }
      ];
    }

    container.innerHTML = items.map(item => `
      <div class="recommend-card selected">
        <div class="supp-icon">${item.icon || '💊'}</div>
        <div class="supp-info">
          <div class="supp-name">${item.name}</div>
          <div class="supp-reason">${item.reason || item.description || ''}</div>
        </div>
        <i class="fa-solid fa-circle-check text-primary"></i>
      </div>
    `).join('');

    // 클릭 시 체크박스 토글
    container.querySelectorAll('.recommend-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        const icon = card.querySelector('i');
        if (card.classList.contains('selected')) {
          icon.className = 'fa-solid fa-circle-check text-primary';
        } else {
          icon.className = 'fa-solid fa-circle-plus text-gray';
        }
      });
    });
  },

  async renderPetOptions() {
    const container = document.getElementById('pet-selection-grid');
    if (!container) return;

    let pet = window.hpetStore.state.pet;
    try {
      // 서버에서 내 캐릭터 정보 조회
      const charInfo = await window.hpetApi.getMyCharacter();
      if (charInfo && charInfo.characterImageUrl) {
        pet = {
          name: charInfo.characterName || pet.name,
          file: charInfo.characterImageUrl || 'char_chick.png'
        };
        window.hpetStore.state.pet.charImage = pet.file;
        window.hpetStore.state.pet.name = pet.name;
        window.hpetStore.saveState();
      } else {
        throw new Error("캐릭터 정보 없음");
      }
    } catch (err) {
      console.warn("캐릭터 API 실패, 로컬 배정 사용", err);
      // fallback
      if (!pet.charImage) {
        pet = window.hpetStore.assignRandomChar();
      } else {
        pet.file = pet.charImage;
      }
    }

    container.innerHTML = `
      <div class="pet-option-card selected" style="cursor: default; width: 100%; padding: 32px 16px; border: 2px solid var(--primary-color);">
        <img src="${pet.file}" alt="${pet.name}" style="width:120px;height:120px;object-fit:contain;margin-bottom:16px;">
        <strong style="font-size: 20px;">당신의 파트너는 '${pet.name}'입니다!</strong>
        <p style="margin-top:8px;color:var(--text-mid);font-size:14px;white-space:normal;">건강 습관을 위한 여정을 함께 할게요.</p>
      </div>
    `;
  },

  renderDashboard() {
    if (window.hpetDashboard) {
      window.hpetDashboard.render();
    }
  },

  renderHistory() {
    const calGrid = document.getElementById('calendar-grid');
    if (!calGrid) return;

    let html = '';
    for (let i = 1; i <= 31; i++) {
      const isChecked = i <= 3; // Demo checked status
      html += `<div class="cal-day ${isChecked ? 'checked' : ''}">${i}</div>`;
    }
    calGrid.innerHTML = html;
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  HPetUI.init();
});
