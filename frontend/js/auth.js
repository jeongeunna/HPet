/**
 * HPet - Auth & Onboarding Permission Management (Stage 2)
 */

class HPetAuthManager {
  constructor() {
    this.permissions = {
      camera: false,
      notification: false,
      healthData: false
    };
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // 비밀번호 재설정 버튼
    document.getElementById('btn-forgot-pw')?.addEventListener('click', () => {
      this.showForgotPwModal();
    });

    // 권한 요청 동의 버튼들
    document.getElementById('btn-grant-permissions')?.addEventListener('click', async () => {
      this.grantAllPermissions();
      const modal = document.getElementById('modal-permissions');
      if (modal) modal.classList.add('hidden');
      
      // 기기 푸시 토큰 등록 (Mock Token)
      try {
        if (window.hpetApi.registerDeviceToken) {
          await window.hpetApi.registerDeviceToken('mock-fcm-device-token-1234');
        }
      } catch (e) {
        console.warn('Failed to register device token', e);
      }
    });

    // 이메일 인증 요청 버튼
    const btnSendCode = document.getElementById('btn-send-email-code');
    if (btnSendCode) {
      btnSendCode.addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value;
        if (!email) {
          alert('이메일을 입력해주세요.');
          return;
        }
        try {
          if (window.hpetApi.sendEmailCode) {
            await window.hpetApi.sendEmailCode(email);
          }
          alert('인증 코드가 발송되었습니다.');
          document.getElementById('email-verification-group').classList.remove('hidden');
        } catch (e) {
          alert('인증 코드 발송 실패: ' + e.message);
        }
      });
    }

    // 이메일 인증 확인 버튼
    const btnVerifyCode = document.getElementById('btn-verify-email-code');
    if (btnVerifyCode) {
      btnVerifyCode.addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value;
        const code = document.getElementById('signup-email-code').value;
        if (!code) {
          alert('인증 코드를 입력해주세요.');
          return;
        }
        try {
          if (window.hpetApi.verifyEmailCode) {
            await window.hpetApi.verifyEmailCode(email, code);
          }
          alert('이메일 인증이 완료되었습니다.');
          document.getElementById('signup-email').readOnly = true;
          document.getElementById('signup-email-code').readOnly = true;
          btnVerifyCode.disabled = true;
          btnVerifyCode.textContent = '인증완료';
        } catch (e) {
          alert('인증 실패: ' + e.message);
        }
      });
    }

    // 비밀번호 재설정 전송 버튼 (모달 내부)
    const btnSendReset = document.getElementById('btn-send-pw-reset');
    if (btnSendReset) {
      btnSendReset.addEventListener('click', async () => {
        const email = document.getElementById('reset-pw-email').value;
        if (!email) {
          alert('이메일을 입력해주세요.');
          return;
        }
        try {
          if (window.hpetApi.resetPassword) {
            await window.hpetApi.resetPassword(email);
          }
          alert('비밀번호 재설정 이메일이 발송되었습니다.');
          document.getElementById('modal-forgot-pw').classList.add('hidden');
        } catch (e) {
          alert('재설정 메일 발송 실패: ' + e.message);
        }
      });
    }
  }

  showForgotPwModal() {
    const modal = document.getElementById('modal-forgot-pw');
    if (modal) modal.classList.remove('hidden');
  }

  showPermissionModal(onComplete) {
    const modal = document.getElementById('modal-permissions');
    if (!modal) {
      if (onComplete) onComplete();
      return;
    }

    modal.classList.remove('hidden');
    
    // 권한 체크박스/스위치 핸들링
    const btnGrant = document.getElementById('btn-grant-permissions');
    btnGrant.onclick = () => {
      this.permissions.camera = document.getElementById('perm-camera')?.checked || true;
      this.permissions.notification = document.getElementById('perm-notification')?.checked || true;
      this.permissions.healthData = document.getElementById('perm-health')?.checked || true;

      window.hpetStore.state.permissions = this.permissions;
      window.hpetStore.saveState();
      window.hpetSound.playSuccess();

      modal.classList.add('hidden');
      if (onComplete) onComplete();
    };
  }

  grantAllPermissions() {
    this.permissions = { camera: true, notification: true, healthData: true };
    window.hpetStore.state.permissions = this.permissions;
    window.hpetStore.saveState();
  }
}

window.hpetAuth = new HPetAuthManager();

document.addEventListener('DOMContentLoaded', () => {
  window.hpetAuth.init();
});
