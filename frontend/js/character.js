/**
 * HPet - Tamagotchi Character Animation & Interaction Engine (Stage 4)
 */

class HPetCharacterEngine {
  constructor() {
    this.container = null;
    this.visual = null;
    this.speech = null;
  }

  init() {
    this.container = document.getElementById('pet-character-wrapper') || document.getElementById('tamagotchi-pet-wrapper');
    this.visual = document.getElementById('main-pet-img') || document.getElementById('pet-visual');
    this.speech = document.getElementById('pet-speech');
    
    // 글로벌 상태에 장착 아이템 배열이 없으면 초기화
    if (!window.hpetStore.state.pet.equippedItems) {
      window.hpetStore.state.pet.equippedItems = [];
    }

    this.bindInteractions();
    this.initCloset();
    this.applyEquippedItems();
    
    // 상태 변경 시 아이템 리렌더링
    window.addEventListener('hpet_state_changed', () => {
      this.applyEquippedItems();
    });
  }

  bindInteractions() {
    // 펫 클릭 시 반응 (쓰다듬기)
    this.container?.addEventListener('click', () => {
      this.playPettingAnimation();
    });

    // 밥주기 (포션 먹이기) 버튼
    document.getElementById('btn-pet-feed')?.addEventListener('click', () => {
      this.feedPotion();
    });

    // 놀아주기 (쓰다듬기) 버튼
    document.getElementById('btn-pet-play')?.addEventListener('click', () => {
      this.playPettingAnimation();
    });
  }

  playPettingAnimation() {
    if (!this.visual) return;
    
    // 사운드 & 하트 파티클 효과
    window.hpetSound.playBeep(880, 0.1, 'sine');
    setTimeout(() => window.hpetSound.playBeep(1046.5, 0.15, 'sine'), 100);

    this.spawnHeartEffect();

    this.visual.classList.add('happy-bounce');
    setTimeout(() => {
      this.visual.classList.remove('happy-bounce');
    }, 1000);

    // 행복도 상승
    const state = window.hpetStore.state;
    state.pet.happiness = Math.min(100, state.pet.happiness + 5);
    window.hpetStore.saveState();

    if (this.speech) {
      const cuteQuotes = [
        "기분이 너무 좋아요! 💕",
        "주인님 사랑해요! ✨",
        "오늘도 바른 자세 잊지 마세요!",
        "영양제 챙겨먹는 모습이 멋져요!"
      ];
      this.speech.textContent = cuteQuotes[Math.floor(Math.random() * cuteQuotes.length)];
    }
  }

  feedPotion() {
    const state = window.hpetStore.state;
    
    if (state.pet.exp <= 0 && state.pet.level <= 1) {
      this.sayBubble("영양제를 인증해서 포션을 모아주세요!");
      window.hpetSound.playBeep(300, 0.15, 'sawtooth');
      return;
    }

    // 포션 먹이기 연출
    window.hpetSound.playSuccess();
    this.spawnPotionEffect();
    this.spawnExpEffect(25); // 예시: +25 획득

    // 경험치 부여
    window.hpetStore.updatePetExp(25);
    
    if (this.speech) {
      this.speech.textContent = "꿀꺽꿀꺽! 포션을 먹고 힘이 나요! 🧪⚡";
    }

    // 대시보드 게이지 업데이트 갱신
    if (window.hpetDashboard) {
      window.hpetDashboard.updateGauges();
    }
  }

  setTurtleNeckAlert(isTurtle) {
    if (!this.visual) return;

    if (isTurtle) {
      this.visual.classList.add('turtle-neck-warning');
      this.sayBubble("⚠️ 으악! 거북목 감지! 목과 어깨를 쭉 펴주세요!");
      window.hpetSound.playBeep(220, 0.3, 'square');
    } else {
      this.visual.classList.remove('turtle-neck-warning');
      this.sayBubble("바른 자세 유지 중! 훌륭해요! 👍");
    }
  }

  sayBubble(text) {
    if (this.speech) {
      this.speech.textContent = text;
    }
  }

  spawnHeartEffect() {
    if (!this.container) return;
    
    // 하트를 3~5개 랜덤하게 생성 (뿅뿅 터지는 효과)
    const heartCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < heartCount; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'floating-particle heart-particle';
        heart.textContent = '💖';
        
        // 캐릭터 주변 랜덤 위치
        const randomLeft = Math.random() * 80 + 10;
        heart.style.left = `${randomLeft}%`;
        
        // 약간의 크기 변형
        const randomScale = 0.8 + Math.random() * 0.5;
        heart.style.transform = `scale(${randomScale})`;
        
        this.container.appendChild(heart);

        setTimeout(() => heart.remove(), 1200);
      }, i * 150); // 0.15초 간격으로 연속 발생
    }
  }

  spawnPotionEffect() {
    if (!this.container) return;
    const potion = document.createElement('div');
    potion.className = 'floating-particle potion-particle';
    potion.textContent = '🧪✨';
    potion.style.left = `50%`;
    this.container.appendChild(potion);

    setTimeout(() => potion.remove(), 1200);
  }

  spawnExpEffect(amount) {
    if (!this.container) return;
    
    // +N 텍스트 이펙트
    const expText = document.createElement('div');
    expText.className = 'floating-particle exp-particle';
    expText.textContent = `+${amount}`;
    expText.style.left = `75%`;
    expText.style.top = `20%`;
    expText.style.color = '#ffb300';
    expText.style.fontWeight = '800';
    expText.style.fontSize = '28px';
    expText.style.textShadow = '0 2px 4px rgba(0,0,0,0.15), 0 0 10px rgba(255,179,0,0.5)';
    this.container.appendChild(expText);

    // 반짝이 파티클 3개 생성
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'floating-particle';
        sparkle.textContent = '✨';
        sparkle.style.left = `${Math.random() * 80 + 10}%`;
        sparkle.style.fontSize = `${Math.random() * 10 + 20}px`;
        this.container.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
      }, i * 100);
    }

    setTimeout(() => expText.remove(), 1200);
  }

  // ==========================================
  // 옷장 (Closet) 로직
  // ==========================================
  initCloset() {
    this.availableItems = [
      { id: 'item_ribbon', name: '빨간 리본', icon: '🎀', type: 'head' },
      { id: 'item_glasses', name: '선글라스', icon: '🕶️', type: 'face' }
    ];

    const btnCloset = document.getElementById('btn-closet');
    const modalCloset = document.getElementById('modal-closet');
    const btnCloseCloset = document.getElementById('btn-close-closet');
    const btnSaveCloset = document.getElementById('btn-save-closet');

    if (btnCloset) {
      btnCloset.addEventListener('click', () => {
        // 현재 장착중인 아이템을 임시 선택 상태로 복사
        this.tempEquipped = [...(window.hpetStore.state.pet.equippedItems || [])];
        this.renderCloset();
        this.updateClosetPreview();
        modalCloset.classList.remove('hidden');
      });
    }

    if (btnCloseCloset) {
      btnCloseCloset.addEventListener('click', () => {
        modalCloset.classList.add('hidden');
      });
    }

    if (btnSaveCloset) {
      btnSaveCloset.addEventListener('click', async () => {
        window.hpetStore.state.pet.equippedItems = [...this.tempEquipped];
        window.hpetStore.saveState();
        
        // 아이템 장착 시 서버에 저장
        try {
          if (window.hpetApi.equipCharacterItem) {
            const itemIdToSave = this.tempEquipped.length > 0 ? this.tempEquipped[0] : null;
            await window.hpetApi.equipCharacterItem(itemIdToSave);
          }
        } catch (e) {
          console.warn("아이템 장착 동기화 실패", e);
        }
        
        // 아이템 장착 시 반짝이는 효과
        window.hpetSound.playSuccess();
        this.spawnHeartEffect();
        
        modalCloset.classList.add('hidden');
      });
    }
  }

  renderCloset() {
    const grid = document.getElementById('closet-grid');
    if (!grid) return;

    grid.innerHTML = this.availableItems.map(item => {
      const isSelected = this.tempEquipped.includes(item.id);
      return `
        <div class="closet-item ${isSelected ? 'selected' : ''}" data-id="${item.id}">
          <div class="closet-item-icon">${item.icon}</div>
          <div class="closet-item-name">${item.name}</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.closet-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const itemDef = this.availableItems.find(i => i.id === id);
        
        if (this.tempEquipped.includes(id)) {
          // 장착 해제
          this.tempEquipped = [];
        } else {
          // 한 번에 1개만 장착
          this.tempEquipped = [id];
        }
        
        this.renderCloset();
        this.updateClosetPreview();
      });
    });
  }

  updateClosetPreview() {
    const previewLayer = document.getElementById('closet-preview-item');
    if (!previewLayer) return;
    
    const html = this.tempEquipped.map(id => {
      const item = this.availableItems.find(i => i.id === id);
      if (!item) return '';
      let style = '';
      if (id === 'item_ribbon') {
        style = 'position: absolute; top: -5%; right: 15%; font-size: 60px; transform: rotate(15deg); line-height: 1;';
      } else if (id === 'item_glasses') {
        style = 'position: absolute; top: 42%; left: 50%; transform: translate(-50%, 0); font-size: 75px; line-height: 1;';
      }
      return `<span style="${style}">${item.icon}</span>`;
    }).join('');
    
    if (html) {
      previewLayer.innerHTML = html;
      previewLayer.style.display = 'block';
    } else {
      previewLayer.style.display = 'none';
      previewLayer.innerHTML = '';
    }
  }

  applyEquippedItems() {
    const layer = document.getElementById('equipped-item-layer');
    if (!layer) return;

    const equipped = window.hpetStore.state.pet.equippedItems || [];
    
    // availableItems가 아직 선언 안됐을 수 있으므로 하드코딩된 리스트 임시 참조
    const allItems = this.availableItems || [
      { id: 'item_ribbon', icon: '🎀' },
      { id: 'item_glasses', icon: '🕶️' }
    ];

    const html = equipped.map(id => {
      const item = allItems.find(i => i.id === id);
      if (!item) return '';
      let style = '';
      if (id === 'item_ribbon') {
        style = 'position: absolute; top: 5%; right: 15%; font-size: 80px; transform: rotate(15deg); line-height: 1; z-index: 6;';
      } else if (id === 'item_glasses') {
        style = 'position: absolute; top: 42%; left: 50%; transform: translate(-50%, 0); font-size: 85px; line-height: 1; z-index: 6;';
      }
      return `<span style="${style}">${item.icon}</span>`;
    }).join('');

    if (html) {
      layer.innerHTML = html;
      layer.style.display = 'block';
    } else {
      layer.innerHTML = '';
      layer.style.display = 'none';
    }
  }
}

window.hpetCharacter = new HPetCharacterEngine();

document.addEventListener('DOMContentLoaded', () => {
  window.hpetCharacter.init();
});
