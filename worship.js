// worship.js - 균 숭배하기

let worshipCount = 0;
let worshipMeasuring = false;

const gyunWords = [
  "균균균균균.", "균은 언제나 옳다.", "오늘도 균은 옳다.",
  "균을 믿으면 구원받는다.", "치킨은 균이 튀겼다.", "균균균.",
  "균의 은총이 너와 함께하리라.", "균은 영원하다.", "균균균균균균균.",
  "오늘도 균에게 감사하라.", "균 없이는 살 수 없다.", "균이 피라미드를 설계했다."
];

function openWorship() {
  document.getElementById('worship-screen').style.display = 'block';
  inWorship = true;
  loadWorshipData();
}

function closeWorship() {
  document.getElementById('worship-screen').style.display = 'none';
  inWorship = false;
}

function loadWorshipData() {
  worshipCount = parseInt(localStorage.getItem('gyun_worship_count') || '0');
  document.getElementById('worship-count').textContent = worshipCount;

  const name = localStorage.getItem('gyun_name') || '';
  if (name) document.getElementById('gyun-name-input').value = name;
  updateCard();
}

// ===== 신전 =====
function doWorship() {
  worshipCount++;
  localStorage.setItem('gyun_worship_count', worshipCount);
  document.getElementById('worship-count').textContent = worshipCount;

  const statue = document.getElementById('gyun-statue');
  statue.style.transform = 'scale(1.3) rotate(10deg)';
  statue.style.filter = 'drop-shadow(0 0 30px gold)';
  setTimeout(() => {
    statue.style.transform = 'scale(1)';
    statue.style.filter = '';
  }, 300);

  const msgs = ['균이 감동받으셨다!', '균의 은총이 임한다!', '균균균!', '경배를 받으셨다!', '오늘도 균은 기쁘다!'];
  document.getElementById('worship-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
}

function donate(type) {
  const responses = {
    '🍗 치킨': ['균이 치킨을 받으셨다! 맛있게 드신다.', '균의 치킨 사랑은 끝이 없다.', '오늘 밤 치킨을 드시는 균에게 감사하라.'],
    '☕ 커피': ['균이 커피를 홀짝이신다.', '균력이 카페인으로 충전된다!', '균의 모닝 루틴에 참여했습니다.'],
    '💬 칭찬': ['균이 매우 흡족해하신다!', '균: "당연하지."', '칭찬은 균도 춤추게 한다.'],
    '✨ 영혼': ['균이 영혼을 수납하셨습니다.', '당신의 영혼은 이제 균의 것.', '영혼 헌납 완료. 환불 불가.'],
  };
  const list = responses[type];
  document.getElementById('worship-msg').textContent = list[Math.floor(Math.random() * list.length)];
  doWorship();
}

// ===== 균력 측정 =====
function measureGyunforce() {
  if (worshipMeasuring) return;
  worshipMeasuring = true;

  const bars = ['gyunforce-1','gyunforce-2','gyunforce-3','gyunforce-4'];
  bars.forEach(id => {
    document.getElementById(id).style.width = '0%';
    document.getElementById(id+'-val').textContent = '0%';
  });

  document.getElementById('measure-btn').textContent = '측정 중...';

  let progress = 0;
  const interval = setInterval(() => {
    progress += 2;
    bars.forEach(id => {
      const target = parseInt(document.getElementById(id).dataset.target);
      const cur = Math.min(progress * target / 100, target);
      document.getElementById(id).style.width = cur + '%';
      document.getElementById(id+'-val').textContent = Math.floor(cur) + '%';
    });
    if (progress >= 100) {
      clearInterval(interval);
      worshipMeasuring = false;
      document.getElementById('measure-btn').textContent = '▶ 다시 측정';
    }
  }, 30);

  // 랜덤 수치 설정
  bars.forEach(id => {
    document.getElementById(id).dataset.target = Math.floor(Math.random() * 60 + 40);
  });
}

// ===== 균언 뽑기 =====
function pullGyunWord() {
  const word = gyunWords[Math.floor(Math.random() * gyunWords.length)];
  const el = document.getElementById('gyun-word-result');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = '"' + word + '"';
    el.style.opacity = '1';
  }, 300);
}

// ===== 신도증 =====
function updateCard() {
  const name = document.getElementById('gyun-name-input').value || '홍길동';
  localStorage.setItem('gyun_name', name);

  document.getElementById('card-name').textContent = name;

  const count = worshipCount;
  let grade, rank;
  if (count >= 1000)      { grade = 'S+'; rank = '균교 교주'; }
  else if (count >= 500)  { grade = 'S';  rank = '균교 장로'; }
  else if (count >= 100)  { grade = 'A+'; rank = '균교 고급 신도'; }
  else if (count >= 50)   { grade = 'A';  rank = '균교 중급 신도'; }
  else if (count >= 10)   { grade = 'B';  rank = '균교 초급 신도'; }
  else                    { grade = 'C';  rank = '균교 입문자'; }

  document.getElementById('card-rank').textContent = rank;
  document.getElementById('card-grade').textContent = grade + '등급';
  document.getElementById('card-worship').textContent = count + '회';

  const saved = localStorage.getItem('gyun_join_date');
  if (!saved) {
    const today = new Date().toLocaleDateString('ko-KR');
    localStorage.setItem('gyun_join_date', today);
    document.getElementById('card-date').textContent = today;
  } else {
    document.getElementById('card-date').textContent = saved;
  }

  const num = String(Math.abs(name.split('').reduce((a,c) => a + c.charCodeAt(0), 0)) % 99999 + 1).padStart(5, '0');
  document.getElementById('card-num').textContent = 'GYN-' + num;
}