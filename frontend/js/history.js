/**
 * HPet - 복용 기록 캘린더 & 자세 불량 이력 히스토리 (Stage 7)
 * 
 * 월별 캘린더 뷰, 복용 도장, 자세 통계 차트 시각화
 */

class HPetHistoryManager {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth(); // 0-indexed
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-prev-month')?.addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.render();
    });

    document.getElementById('btn-next-month')?.addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.render();
    });

    document.getElementById('btn-go-today')?.addEventListener('click', () => {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth();
      this.render();
    });

    const monthPicker = document.getElementById('cal-month-picker');
    if (monthPicker) {
      // 초기 밸류 세팅 (YYYY-MM)
      const initValue = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
      monthPicker.value = initValue;

      monthPicker.addEventListener('change', (e) => {
        if (!e.target.value) return;
        const parts = e.target.value.split('-');
        this.currentYear = parseInt(parts[0], 10);
        this.currentMonth = parseInt(parts[1], 10) - 1;
        this.render();
      });
    }
  }

  async render() {
    const yyyy = this.currentYear;
    const mm = String(this.currentMonth + 1).padStart(2, '0');
    const firstDayStr = `${yyyy}-${mm}-01`;

    try {
      // API에서 해당 월 기록 조회 (startDate를 yyyy-mm-01로 사용, 실제론 서버가 한 달치 줄 수 있게 처리됨)
      // 백엔드는 startDate~endDate를 받지만, 여기서는 간단히 month 파라미터를 넘기는 것으로 api.js에 구현됨. 
      // api.js getDoseRecords(month)는 /dose-records?month=yyyy-mm 이므로 그에 맞게 전달
      const doseRecords = await window.hpetApi.getDoseRecords(`${yyyy}-${mm}`);
      const postureSummary = await window.hpetApi.getPostureSummary(`${yyyy}-${mm}`);

      const historyMap = {};

      if (doseRecords) {
        doseRecords.forEach(d => {
          const date = d.doseDate;
          if (!historyMap[date]) historyMap[date] = {};
          historyMap[date].supplements = true; // 만약 여러건이면 어떻게 할지는 기획에 따라, 여기선 하나라도 먹으면 true
        });
      }

      if (postureSummary) {
        postureSummary.forEach(p => {
          const date = p.date;
          if (!historyMap[date]) historyMap[date] = {};
          historyMap[date].turtleCount = p.count;
        });
      }

      window.hpetStore.state.history = historyMap;
    } catch(err) {
      console.warn("히스토리 내역을 가져오는데 실패했습니다.", err);
    }

    this.renderCalendar();
    this.renderStats();
  }

  renderCalendar() {
    const titleEl = document.getElementById('cal-month-title');
    const gridEl = document.getElementById('calendar-grid');
    if (!titleEl || !gridEl) return;

    titleEl.textContent = `${this.currentYear}년 ${this.currentMonth + 1}월`;
    
    const monthPicker = document.getElementById('cal-month-picker');
    if (monthPicker) {
      monthPicker.value = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    }

    const history = window.hpetStore.state.history || {};

    // 해당 월의 1일이 무슨 요일인지, 마지막 날짜 계산
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    // 요일 헤더
    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    let html = dayHeaders.map(d => `<div class="cal-header">${d}</div>`).join('');

    // 1일 앞의 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day empty"></div>`;
    }

    // 날짜 셀 생성
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = history[dateKey];

      // 오늘 날짜 여부
      const now = new Date();
      const isToday = (this.currentYear === now.getFullYear()
        && this.currentMonth === now.getMonth()
        && day === now.getDate());

      // 복용 완료 여부
      const isChecked = record && record.supplements === true;

      // 거북목 감지 여부
      const hasTurtle = record && record.turtleCount > 0;

      let classes = 'cal-day';
      if (isToday) classes += ' today';
      if (isChecked) classes += ' checked';
      if (hasTurtle) classes += ' turtle';

      html += `
        <div class="${classes}" data-date="${dateKey}">
          <span class="day-num">${day}</span>
          <div class="cal-dots">
            ${isChecked ? '<div class="dot dot-supp"></div>' : ''}
            ${hasTurtle ? '<div class="dot dot-turtle"></div>' : ''}
          </div>
        </div>
      `;
    }

    gridEl.innerHTML = html;

    // 날짜 클릭 시 상세 정보 표시
    gridEl.querySelectorAll('.cal-day:not(.empty)').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const dateKey = e.currentTarget.dataset.date;
        this.showDayDetail(dateKey);
      });
    });
  }

  showDayDetail(dateKey) {
    const record = window.hpetStore.state.history[dateKey];
    const parts = dateKey.split('-');
    const label = `${parseInt(parts[1])}월 ${parseInt(parts[2])}일`;

    const titleEl = document.getElementById('daily-detail-date');
    const timelineEl = document.getElementById('daily-timeline');
    const modal = document.getElementById('modal-daily-detail');
    
    if (titleEl) titleEl.textContent = `${label} 기록`;

    // 닫기 버튼 이벤트
    const closeBtn = document.getElementById('btn-close-daily');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }

    if (!record) {
      timelineEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: var(--text-light);">
          <i class="fa-regular fa-calendar-xmark" style="font-size: 40px; margin-bottom: 12px; color: #d0d0d0;"></i>
          <p>해당 날짜에 기록된 데이터가 없습니다.</p>
        </div>
      `;
      if (modal) modal.classList.remove('hidden');
      return;
    }

    let timelineHtml = '';

    // 영양제 복용 타임라인 (가상 시간)
    if (record.supplements) {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-time">08:00 AM</div>
          <div class="timeline-icon supp"><i class="fa-solid fa-capsules"></i></div>
          <div class="timeline-content" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="timeline-title">영양제 복용 완료</div>
              <div class="timeline-desc">비타민C 외 2개 복용 확인</div>
            </div>
            <button class="btn-more-options" onclick="alert('복용 기록을 수정하거나 삭제하시겠습니까? (Mock)')" title="기록 수정/삭제"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          </div>
        </div>
      `;
    }

    // 거북목 타임라인 (가상 횟수)
    if (record.turtleCount > 0) {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-time">14:30 PM</div>
          <div class="timeline-icon turtle"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="timeline-content" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="timeline-title">자세 불량 감지</div>
              <div class="timeline-desc">총 ${record.turtleCount}회 거북목 자세 경고 발생</div>
            </div>
            <button class="btn-more-options" onclick="alert('자세 경고 기록을 삭제하시겠습니까? (Mock)')" title="기록 삭제"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          </div>
        </div>
      `;
      // 미니게임 클리어 임시 이력 추가
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-time">14:40 PM</div>
          <div class="timeline-icon" style="background:#e3f2fd; color:#1976d2;"><i class="fa-solid fa-gamepad"></i></div>
          <div class="timeline-content" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="timeline-title">자세 교정 미니게임 완료</div>
              <div class="timeline-desc">스트레칭으로 자세를 교정했습니다!</div>
            </div>
            <button class="btn-more-options" onclick="alert('미니게임 기록을 삭제하시겠습니까? (Mock)')" title="기록 삭제"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          </div>
        </div>
      `;
    }

    if (!timelineHtml) {
      timelineHtml = `<div style="text-align:center; padding: 20px; color: var(--text-light);">세부 기록이 없습니다.</div>`;
    }

    timelineEl.innerHTML = timelineHtml;
    if (modal) modal.classList.remove('hidden');
  }

  renderStats() {
    const history = window.hpetStore.state.history || {};
    let totalDays = 0;
    let suppDays = 0;
    let totalTurtleCount = 0;

    // 현재 월의 데이터만 필터링
    const currentPrefix = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    Object.keys(history).forEach(date => {
      if (date.startsWith(currentPrefix)) {
        totalDays++;
        if (history[date].supplements) suppDays++;
        if (history[date].turtleCount) totalTurtleCount += history[date].turtleCount;
      }
    });

    const suppPercent = totalDays > 0 ? Math.round((suppDays / totalDays) * 100) : 0;
    const turtleCount = totalTurtleCount;

    const suppPercentEl = document.getElementById('stat-supp-percent');
    const suppBarEl = document.getElementById('stat-supp-bar');
    if (suppPercentEl) suppPercentEl.textContent = `${suppPercent}%`;
    if (suppBarEl) suppBarEl.style.width = `${suppPercent}%`;

    const posturePercentEl = document.getElementById('stat-posture-percent');
    const postureBarEl = document.getElementById('stat-posture-bar');
    
    if (posturePercentEl) posturePercentEl.textContent = `${turtleCount}회 경고`;
    if (postureBarEl) {
      // 10회 경고를 100%로 가정
      const pct = Math.min(100, (turtleCount / 10) * 100);
      postureBarEl.style.width = `${pct}%`;
    }
  }
}

window.hpetHistory = new HPetHistoryManager();

document.addEventListener('DOMContentLoaded', () => {
  window.hpetHistory.init();
});
