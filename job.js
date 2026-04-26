// job.js - 직업 시스템

let playerJob = {
  current: 'none',
  level: 0,
  jobChangeCount: 0
};

function loadJobData() {
  const saved = JSON.parse(localStorage.getItem('gyun_job') || '{}');
  playerJob = {
    current: saved.current || 'none',
    level: saved.level || 0,
    jobChangeCount: saved.jobChangeCount || 0
  };
}

function saveJobData() {
  localStorage.setItem('gyun_job', JSON.stringify(playerJob));
}

function canChangeJob(jobName, playerLevel) {
  // 이미 최강 직업이면 전직 불가
  if (playerJob.current === '광신도' || playerJob.current === '혈검사' || playerJob.current === '금서술사') {
    return false;
  }

  // 최강 직업 3개: 레벨만 충족하면 됨
  if (jobName === '광신도') return playerLevel >= 50;
  if (jobName === '혈검사') return playerLevel >= 45;
  if (jobName === '금서술사') return playerLevel >= 50;

  // 첫 직업: 레벨 10 이상
  if (playerJob.current === 'none') {
    return playerLevel >= 10 && (jobName === '마법사' || jobName === '검사' || jobName === '균 숭배자');
  }

  // 마검사: 레벨 30 이상, 첫 직업 보유
  if (jobName === '마검사') {
    return playerLevel >= 30 && playerJob.current !== 'none';
  }

  return false;
}

function changeJob(newJob) {
  playerJob.current = newJob;
  playerJob.jobChangeCount++;
  saveJobData();
  console.log(`직업이 ${newJob}로 변경되었습니다!`);
  return true;
}

function getJobInfo() {
  const jobInfos = {
    'none': { name: '직업 없음', description: '아직 직업이 없습니다.', color: '#9ca3af' },
    '마법사': { name: '🧙 마법사', description: '마법으로 적을 처치하는 마법사', color: '#8b5cf6' },
    '검사': { name: '⚔️ 검사', description: '검으로 적을 참살하는 검사', color: '#ef4444' },
    '균 숭배자': { name: '👑 균 숭배자', description: '균의 가호를 받는 신도', color: '#ffd700' },
    '마검사': { name: '✨ 마검사', description: '마법과 검술을 모두 사용하는 전설의 전사', color: '#ff1493' },
    '광신도': { name: '⛪ 광신도', description: '균의 심판으로 모든 것을 소멸시키는 대사제', color: '#ffd700' },
    '혈검사': { name: '🩸 혈검사', description: '피를 대가로 무한히 강해지는 피의 기사', color: '#dc143c' },
    '금서술사': { name: '📖 금서술사', description: '금단의 페이지로 세계를 뒤흔드는 학자', color: '#7c3aed' },
  };
  return jobInfos[playerJob.current] || jobInfos['none'];
}

function getJobChangeMessage(jobName, playerLevel) {
  if (playerJob.current === '광신도' || playerJob.current === '혈검사' || playerJob.current === '금서술사') {
    return `당신은 이미 최강 직업 '${playerJob.current}'을 갖고 있습니다!`;
  }

  if (jobName === '광신도' && playerLevel < 50) return `레벨 50 이상이 되면 광신도로 전직할 수 있습니다.\n현재 레벨: ${playerLevel}`;
  if (jobName === '혈검사' && playerLevel < 45) return `레벨 45 이상이 되면 혈검사로 전직할 수 있습니다.\n현재 레벨: ${playerLevel}`;
  if (jobName === '금서술사' && playerLevel < 50) return `레벨 50 이상이 되면 금서술사로 전직할 수 있습니다.\n현재 레벨: ${playerLevel}`;

  if (playerJob.current === 'none' && playerLevel < 10) {
    return `레벨 10 이상이 되면 ${jobName}로 전직할 수 있습니다.\n현재 레벨: ${playerLevel}`;
  }
  if (jobName === '마검사' && playerLevel < 30) {
    return `레벨 30 이상이 되면 마검사로 전직할 수 있습니다.\n현재 레벨: ${playerLevel}`;
  }

  return '';
}