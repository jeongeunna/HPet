/**
 * HPet - Dashboard Controller & Mission Checklist Management (Stage 4)
 */

class HPetDashboardManager {
  constructor() {
    this.dateTag = null;
    this.missionContainer = null;
  }

  init() {
    this.dateTag = document.getElementById('current-date-tag');
    this.missionContainer = document.getElementById('today-mission-list');
    this.setCurrentDate();
    this.render();

    // 상태 변경 이벤트 수신 시 자동으로 화면 갱신
    window.addEventListener('hpet_state_changed', () => {
      this.render();
      if (document.getElementById('modal-manage-supplements') && !document.getElementById('modal-manage-supplements').classList.contains('hidden')) {
        this.renderManageSupplements();
      }
    });

    // 대시보드 영양제 추가 버튼
    const btnAddSupp = document.getElementById('btn-add-supp-dashboard');
    if (btnAddSupp) {
      btnAddSupp.addEventListener('click', () => {
        const modal = document.getElementById('modal-custom-supp');
        if (modal) {
          document.getElementById('custom-supp-name').value = ''; // 초기화
          delete modal.dataset.editId; // 생성 모드
          document.getElementById('modal-supp-title').textContent = '영양제 추가';
          document.getElementById('btn-delete-supp').classList.add('hidden');
          modal.classList.remove('hidden');
        }
      });
    }

    // 전체 보기 버튼 (영양제 관리 모달 열기)
    const btnViewAll = document.getElementById('btn-view-all');
    if (btnViewAll) {
      btnViewAll.addEventListener('click', () => {
        this.renderManageSupplements();
        document.getElementById('modal-manage-supplements').classList.remove('hidden');
      });
    }

    // 영양제 관리 모달 닫기
    const btnCloseManage = document.getElementById('btn-close-manage-supps');
    if (btnCloseManage) {
      btnCloseManage.addEventListener('click', () => {
        document.getElementById('modal-manage-supplements').classList.add('hidden');
      });
    }

    // 새 영양제 추가 버튼 (관리 모달 내)
    const btnOpenAddSupp = document.getElementById('btn-open-add-supp');
    if (btnOpenAddSupp) {
      btnOpenAddSupp.addEventListener('click', () => {
        document.getElementById('modal-manage-supplements').classList.add('hidden');
        const modal = document.getElementById('modal-custom-supp');
        if (modal) {
          document.getElementById('custom-supp-name').value = '';
          document.getElementById('custom-supp-time').value = '09:00 AM';
          delete modal.dataset.editId;
          document.getElementById('modal-supp-title').textContent = '새 영양제 등록';
          document.getElementById('btn-delete-supp').classList.add('hidden');
          modal.classList.remove('hidden');
        }
      });
    }

    const btnDeleteSupp = document.getElementById('btn-delete-supp');
    if (btnDeleteSupp) {
      btnDeleteSupp.addEventListener('click', async () => {
        const modal = document.getElementById('modal-custom-supp');
        const idInput = modal.dataset.editId;
        if (idInput && confirm('이 영양제를 삭제하시겠습니까?')) {
          try {
            if (window.hpetApi.removeSupplement && idInput.startsWith('supp_') === false) { 
              // 임시 데이터('supp_1' 등)가 아닐 경우 서버 삭제 시도
              await window.hpetApi.removeSupplement(idInput);
            }
          } catch (e) {
            console.warn('영양제 삭제 API 호출 실패:', e);
          }
          
          const state = window.hpetStore.state;
          window.hpetStore.state.supplements = state.supplements.filter(s => s.id !== idInput);
          window.hpetStore.saveState();
          
          modal.classList.add('hidden');
          this.renderManageSupplements();
          document.getElementById('modal-manage-supplements').classList.remove('hidden');
        }
      });
    }
  }

  setCurrentDate() {
    if (!this.dateTag) return;
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[now.getDay()];

    this.dateTag.textContent = `${month}월 ${date}일 (${dayName})`;
  }

  async render() {
    try {
      const summary = await window.hpetApi.getHomeSummary();
      if (!summary) return;
      
      // Update store state with latest summary
      window.hpetStore.state.pet.exp = summary.characterExp || 0;
      window.hpetStore.state.pet.maxExp = summary.characterMaxExp || 100;
      window.hpetStore.state.pet.level = summary.characterLevel || 1;
      window.hpetStore.state.pet.postureHealth = summary.postureScore || 100;
      window.hpetStore.state.pet.charImage = summary.characterImageUrl || window.hpetStore.state.pet.charImage;
      window.hpetStore.state.pet.name = summary.characterName || window.hpetStore.state.pet.name;
      
      // Update supplements
      if (summary.supplements) {
        window.hpetStore.state.supplements = summary.supplements.map(s => ({
          id: s.id || s.userSupplementId,
          name: s.name,
          time: s.time || s.doseTime,
          takenToday: s.takenToday || s.isTaken
        }));
      }

      // 렌더링
      this.updateHeader(summary);
      this.updateGauges();
      this.renderMissions();
      
      // 캐릭터 이미지 갱신
      const charImg = document.getElementById('pet-char-img');
      if (charImg && window.hpetStore.state.pet.charImage) {
        charImg.src = window.hpetStore.state.pet.charImage;
      }
    } catch(err) {
      console.error("홈 요약 정보 로드 실패:", err);
    }
  }

  updateHeader(summary) {
    const usernameEl = document.getElementById('header-username');
    const streakEl = document.getElementById('header-streak');
    if (usernameEl) usernameEl.textContent = `${summary.userName || window.hpetStore.state.user.name}님`;
    if (streakEl) streakEl.textContent = summary.streakDays || window.hpetStore.state.user.streak;
  }

  updateGauges() {
    const state = window.hpetStore.state;
    
    // 포션/경험치 바
    const barExp = document.getElementById('bar-exp');
    const valExp = document.getElementById('val-exp');
    if (barExp && valExp) {
      barExp.style.width = `${state.pet.exp}%`;
      valExp.textContent = `Lv.${state.pet.level} (${state.pet.exp}/${state.pet.maxExp})`;
    }

    // 자세 건강도 바
    const barPosture = document.getElementById('bar-posture');
    const valPosture = document.getElementById('val-posture');
    if (barPosture && valPosture) {
      barPosture.style.width = `${state.pet.postureHealth}%`;
      valPosture.textContent = `${state.pet.postureHealth} / 100`;
    }
  }

  renderMissions() {
    if (!this.missionContainer) return;
    const state = window.hpetStore.state;

    if (!state.supplements || state.supplements.length === 0) {
      this.missionContainer.innerHTML = `
        <div class="empty-mission">
          <p>등록된 영양제가 없습니다. 프로필 설정에서 추가해보세요!</p>
        </div>
      `;
      return;
    }

    // 영양제 약어 매핑 (기획서 스타일: C, D, Zn, Pro 등)
    const abbrMap = {
      '비타민 C': 'C', '비타민 D': 'D', '아연': 'Zn', '프로바이오틱스': 'Pro',
      '오메가3': 'Ω3', '마그네슘': 'Mg', '비타민 B군': 'B', '철분': 'Fe',
      '루테인': 'Lu', '칼슘': 'Ca', '콜라겐': 'Co'
    };

    // 아이콘 색상 클래스 순환 (새 디자인용)
    const colors = ['yellow', 'blue', 'red', 'green', 'purple'];
    const icons = ['fa-capsules', 'fa-tablets', 'fa-pills'];

    // 대시보드 리스트 렌더링 (최대 3개 정도만 미리보기로 보여주거나 전체 보여주기)
    this.missionContainer.innerHTML = state.supplements.slice(0, 3).map((supp, idx) => {
      const colorCls = colors[idx % colors.length];
      const iconCls = icons[idx % icons.length];
      
      return `
        <div class="pill-item ${supp.takenToday ? 'taken' : ''}">
          <i class="fa-solid ${iconCls} pill-icon ${colorCls}"></i>
          <span class="pill-name">${supp.name}</span>
          <span class="pill-time">${supp.time || ''}</span>
          ${supp.takenToday
            ? '<i class="fa-solid fa-circle-check check-icon text-green"></i>'
            : '<i class="fa-regular fa-circle check-icon text-gray"></i>'
          }
        </div>
      `;
    }).join('');

    // 여기서 카드의 숫자 부분 업데이트
    const takenCount = state.supplements.filter(s => s.takenToday).length;
    const totalCount = state.supplements.length;
    const fractionText = document.querySelector('.home-card.pill-card .fraction-text');
    if (fractionText) {
      fractionText.innerHTML = `<strong class="text-yellow">${takenCount}</strong> / ${totalCount}`;
    }
  }

  renderManageSupplements() {
    const listContainer = document.getElementById('manage-supps-list');
    if (!listContainer) return;

    const state = window.hpetStore.state;
    if (!state.supplements || state.supplements.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-mid);">등록된 영양제가 없습니다.</div>`;
      return;
    }

    listContainer.innerHTML = state.supplements.map(supp => `
      <div class="manage-supp-item">
        <div class="manage-supp-info">
          <span class="manage-supp-name">${supp.name}</span>
          <span class="manage-supp-time">${supp.time || ''}</span>
        </div>
        <div style="position: relative;">
          <button class="btn-more-options" data-id="${supp.id}">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
        </div>
      </div>
    `).join('');

    // ... 버튼(수정 모달 띄우기)
    listContainer.querySelectorAll('.btn-more-options').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const suppId = e.currentTarget.dataset.id;
        const targetSupp = state.supplements.find(s => s.id === suppId);
        
        document.getElementById('modal-manage-supplements').classList.add('hidden');
        const modal = document.getElementById('modal-custom-supp');
        
        if (targetSupp && modal) {
          modal.dataset.editId = suppId;
          document.getElementById('custom-supp-name').value = targetSupp.name;
          document.getElementById('custom-supp-time').value = targetSupp.time || '09:00 AM';
          document.getElementById('modal-supp-title').textContent = '영양제 수정';
          document.getElementById('btn-delete-supp').classList.remove('hidden');
          modal.classList.remove('hidden');
        }
      });
    });

  }
}

window.hpetDashboard = new HPetDashboardManager();

document.addEventListener('DOMContentLoaded', () => {
  window.hpetDashboard.init();
});
