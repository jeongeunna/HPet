/**
 * HPet - Profile & Settings Logic
 */

class HPetProfileManager {
  constructor() {
    this.bindEvents();
    this.loadSettings();
  }

  render() {
    const state = window.hpetStore.state;
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    
    if (nameDisplay) nameDisplay.textContent = `${state.user.name}님`;
    if (emailDisplay) emailDisplay.textContent = state.user.email;
  }

  bindEvents() {
    // 뷰 진입 시 렌더링
    window.addEventListener('hpet_view_enter_profile', () => {
      this.render();
    });

    // 다크모드 토글
    const darkToggle = document.getElementById('toggle-dark-mode');
    if (darkToggle) {
      darkToggle.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        if (isDark) {
          document.body.setAttribute('data-theme', 'dark');
        } else {
          document.body.removeAttribute('data-theme');
        }
        localStorage.setItem('hpet_dark_mode', isDark ? 'true' : 'false');
        if (window.hpetSound) window.hpetSound.playClick();
      });
    }

    // 푸시 알림 토글 (Notification CRUD)
    const pushToggle = document.getElementById('toggle-push');
    if (pushToggle) {
      pushToggle.addEventListener('change', async (e) => {
        const isEnabled = e.target.checked;
        try {
          if (window.hpetApi && window.hpetApi.saveAlarm) {
            await window.hpetApi.saveAlarm({ type: 'ALL', enabled: isEnabled });
          }
        } catch (err) {
          console.warn("알림 설정 실패", err);
          e.target.checked = !isEnabled; // revert
        }
      });
    }

    // 로그아웃
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('로그아웃 하시겠습니까?')) {
          window.hpetStore.state.user.isLoggedIn = false;
          window.hpetStore.saveState();
          window.hpetRouter.navigateTo('auth');
        }
      });
    }

    // 회원탈퇴
    const btnDelete = document.getElementById('btn-delete-account');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (confirm('정말 탈퇴하시겠습니까? 모든 펫 정보와 기록이 삭제되며 복구할 수 없습니다.')) {
          localStorage.removeItem('HPET_APP_STATE_V1');
          localStorage.removeItem('hpet_dark_mode');
          if (window.hpetApi) window.hpetApi.clearTokens();
          alert('회원탈퇴가 완료되었습니다.');
          
          window.hpetStore.state = window.hpetStore.getInitialState();
          window.hpetStore.state.user.isLoggedIn = false;
          window.hpetRouter.navigateTo('auth');
        }
      });
    }

    // 프로필 수정 모달
    const btnEdit = document.getElementById('btn-edit-profile');
    const modalEdit = document.getElementById('modal-edit-profile');
    const btnCloseEdit = document.getElementById('btn-close-edit-profile');
    const btnSaveEdit = document.getElementById('btn-save-profile');
    const inputName = document.getElementById('edit-profile-name');

    if (btnEdit && modalEdit) {
      btnEdit.addEventListener('click', () => {
        inputName.value = window.hpetStore.state.user.name;
        modalEdit.classList.remove('hidden');
        if (window.hpetSound) window.hpetSound.playClick();
      });
    }

    if (btnCloseEdit) {
      btnCloseEdit.addEventListener('click', () => {
        modalEdit.classList.add('hidden');
      });
    }

    if (btnSaveEdit) {
      btnSaveEdit.addEventListener('click', () => {
        const newName = inputName.value.trim();
        if (newName) {
          window.hpetStore.state.user.name = newName;
          window.hpetStore.saveState();
          this.render();
          
          // 헤더 이름도 업데이트
          const headerName = document.getElementById('header-username');
          if (headerName) headerName.textContent = `${newName}님`;
          
          modalEdit.classList.add('hidden');
          if (window.hpetSound) window.hpetSound.playSuccess();
        }
      });
    }
  }

  loadSettings() {
    // 초기 로드 시 다크모드 세팅 적용
    const isDark = localStorage.getItem('hpet_dark_mode') === 'true';
    const darkToggle = document.getElementById('toggle-dark-mode');
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
      if (darkToggle) darkToggle.checked = true;
    }
  }
}

// 인스턴스 생성
window.hpetProfile = new HPetProfileManager();
