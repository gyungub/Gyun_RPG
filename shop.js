// shop.js - 균균 월드 상점 시스템

let shopItems = [
  {
    id: 1,
    name: "HP 포션",
    desc: "체력을 50 회복합니다.",
    price: 30,
    type: "consume",
    effect: () => {
      if (battleState) {
        battleState.playerHp = Math.min(battleState.playerHp + 50, battleState.playerMaxHp);
        updateBattleHUD();
      }
      return "HP가 50 회복되었습니다!";
    }
  },
  {
    id: 2,
    name: "대형 HP 포션",
    desc: "체력을 120 회복합니다.",
    price: 70,
    type: "consume",
    effect: () => {
      if (battleState) {
        battleState.playerHp = Math.min(battleState.playerHp + 120, battleState.playerMaxHp);
        updateBattleHUD();
      }
      return "HP가 120 회복되었습니다!";
    }
  },
  {
    id: 3,
    name: "경험치 물약",
    desc: "경험치를 150 얻습니다.",
    price: 45,
    type: "consume",
    effect: () => {
      if (battleState) {
        battleState.playerExp += 150;
        const expNeeded = battleState.playerLevel * 50;
        if (battleState.playerExp >= expNeeded) {
          battleState.playerExp -= expNeeded;
          battleState.playerLevel++;
          battleState.playerMaxHp += 20;
          battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
        }
        updateBattleHUD();
      }
      return "경험치 150을 얻었습니다!";
    }
  },
  {
    id: 4,
    name: "코인 2배 물약 (1회)",
    desc: "다음 스테이지에서 코인을 2배로 얻습니다.",
    price: 120,
    type: "buff",
    effect: () => "다음 스테이지 코인 2배 버프가 적용되었습니다! (아직 미구현)"
  },
  {
    id: 5,
    name: "레벨 업 티켓",
    desc: "즉시 레벨을 1 올립니다.",
    price: 200,
    type: "special",
    effect: () => {
      if (battleState) {
        battleState.playerLevel++;
        battleState.playerMaxHp += 20;
        battleState.playerHp = battleState.playerMaxHp;
        updateBattleHUD();
        saveBattleData();
      }
      return "레벨이 상승했습니다!";
    }
  }
];

let shopOpen = false;

// 상점 화면 열기
function openShop() {
  shopOpen = true;
  showHUD = false;   // 기존 HUD 숨기기

  const shopHTML = `
    <div id="shop-screen" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,10,30,0.97);z-index:10000;color:white;font-family:'Jua',sans-serif;overflow-y:auto;">
      <button onclick="closeShop()" style="position:fixed;top:25px;left:25px;padding:12px 28px;background:#1a1a2e;color:white;border:2px solid #ffd700;border-radius:50px;font-size:1.1rem;cursor:pointer;z-index:10001;">← 맵으로 돌아가기</button>
      
      <div style="max-width:900px;margin:40px auto;padding:20px;">
        <h1 style="text-align:center;font-size:3rem;margin-bottom:10px;color:#ffd700;">🛒 균균 상점</h1>
        <p style="text-align:center;color:#aaa;margin-bottom:40px;">현재 코인: <span id="shop-coin" style="color:#ffd700;font-size:1.4rem;">${battleState ? battleState.playerCoins : 0}</span></p>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
          ${shopItems.map(item => `
            <div style="background:rgba(255,255,255,0.08);border:2px solid #ffd700;border-radius:20px;padding:20px;transition:0.3s;">
              <h3 style="margin:0 0 8px 0;color:#ffd700;">${item.name}</h3>
              <p style="color:#ccc;margin:8px 0 16px 0;min-height:44px;">${item.desc}</p>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:1.5rem;color:#ffd700;">💰 ${item.price}</span>
                <button onclick="buyItem(${item.id})" 
                        style="padding:10px 24px;background:linear-gradient(135deg,#ffd700,#ff8c00);color:#1a1a2e;border:none;border-radius:12px;font-weight:bold;cursor:pointer;">
                  구매하기
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // 기존에 shop-screen이 있으면 제거 후 새로 추가
  const oldShop = document.getElementById('shop-screen');
  if (oldShop) oldShop.remove();

  document.body.insertAdjacentHTML('beforeend', shopHTML);
}

// 상점 닫기
function closeShop() {
  const shopScreen = document.getElementById('shop-screen');
  if (shopScreen) shopScreen.remove();
  shopOpen = false;
  showHUD = true;
}

// 아이템 구매 함수
function buyItem(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;

  if (!battleState || battleState.playerCoins < item.price) {
    alert("코인이 부족합니다!");
    return;
  }

  // 코인 차감
  battleState.playerCoins -= item.price;

  // 효과 실행
  const message = item.effect();

  // 코인 표시 업데이트
  const coinEl = document.getElementById('shop-coin');
  if (coinEl) coinEl.textContent = battleState.playerCoins;

  saveBattleData();
  updateBattleHUD();

  alert(`${item.name} 구매 완료!\n${message}`);
}