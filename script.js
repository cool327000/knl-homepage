// KNL 홈페이지용 스크립트
// 이미지 기준 순위 반영된 standings 포함

// teams 및 standings (이미지 기준)
const teams = [
  { id: 1, name: 'Yomiuri Giants', abbr: 'YGI' },
  { id: 2, name: 'Kiwoom Heroes',  abbr: 'KHW' }
];

const standings = [
  // Yomiuri Giants: GP 2 W1 L1 D0 PCT .500 R 6 RA 1 RD 5 STREAK L1
  { teamId: 1, gp: 2, w: 1, l: 1, d: 0, r: 6, ra: 1, rd: 5, streak: 'L1' },

  // Kiwoom Heroes: GP 2 W1 L1 D0 PCT .500 R 1 RA 6 RD -5 STREAK W1
  { teamId: 2, gp: 2, w: 1, l: 1, d: 0, r: 1, ra: 6, rd: -5, streak: 'W1' }
];

// 기타 더미 데이터 (경기/뉴스 등)
const games = [
  { id: 101, home: 1, away: 2, homeScore: 3, awayScore: 2, status: '9회말 2아웃' }
];

const news = [
  { id: 1, title: 'KNL, 신인 드래프트 개최 확정', excerpt: 'KNL 리그가 올해 드래프트 일정을 공개했습니다.' },
  { id: 2, title: '서울 라이온즈, 외국인 투수 영입', excerpt: '서울이 북미 리그 출신 좌완을 영입했습니다.' }
];

// 유틸: 팀 이름 찾기
function tName(id) { const t = teams.find(x => x.id === id); return t ? t.name : '---'; }

// 경기 카드 렌더
function renderGames(){
  const el = document.getElementById('games');
  if(!el) return;
  el.innerHTML = '';
  games.forEach(g => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="teams">
        <div class="team"><div class="name">${tName(g.away)}</div><div class="score">${g.awayScore}</div></div>
        <div class="status">${g.status}</div>
        <div class="team"><div class="score">${g.homeScore}</div><div class="name">${tName(g.home)}</div></div>
      </div>
    `;
    el.appendChild(card);
  });
}

// 순위 렌더 (승률 내림차순, 승률 같으면 RD 내림차순으로 정렬)
function renderStandings() {
  const tbody = document.querySelector('#standings-table tbody');
  if(!tbody) return;
  tbody.innerHTML = '';

  // 정렬된 복사본 생성
  const sorted = standings.slice().sort((a, b) => {
    const pctA = (a.w + a.l) ? (a.w / (a.w + a.l)) : 0;
    const pctB = (b.w + b.l) ? (b.w / (b.w + b.l)) : 0;
    if (pctB !== pctA) return pctB - pctA;
    return (b.rd || 0) - (a.rd || 0);
  });

  sorted.forEach((s, idx) => {
    const tr = document.createElement('tr');
    const pct = (s.w + s.l) ? (s.w / (s.w + s.l)).toFixed(3).slice(1) : '.000';
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${tName(s.teamId)}</td>
      <td>${s.w}</td>
      <td>${s.l}</td>
      <td>${s.d ?? 0}</td>
      <td>${pct}</td>
      <td>${s.r ?? '-'}</td>
      <td>${s.ra ?? '-'}</td>
      <td>${s.rd ?? '-'}</td>
      <td>${s.streak ?? '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 오늘 일정 렌더
function renderSchedule(){
  const ul = document.getElementById('today-schedule');
  if(!ul) return;
  ul.innerHTML = '';
  games.forEach(g => {
    const li = document.createElement('li');
    li.textContent = `${tName(g.away)} @ ${tName(g.home)} — ${g.status}`;
    ul.appendChild(li);
  });
}

// 뉴스 렌더
function renderNews(){
  const wrap = document.getElementById('news-carousel');
  if(!wrap) return;
  wrap.innerHTML = '';
  news.forEach(n => {
    const d = document.createElement('div');
    d.className = 'news-item';
    d.innerHTML = `<h4>${n.title}</h4><p>${n.excerpt}</p>`;
    wrap.appendChild(d);
  });
}

// 팀 카드 렌더
function renderTeams(){
  const grid = document.getElementById('teams-grid');
  if(!grid) return;
  grid.innerHTML = '';
  teams.forEach(t => {
    const c = document.createElement('div');
    c.className = 'team-card';
    c.innerHTML = `<div class="badge">${t.abbr}</div><div class="team-name">${t.name}</div>`;
    grid.appendChild(c);
  });
}

// 실시간 시뮬레이션: 점수 랜덤 변동 (데모용)
function simulateLive(){
  games.forEach(g => {
    if(Math.random() < 0.25){
      const incHome = Math.random() < 0.5;
      if(incHome) g.homeScore++;
      else g.awayScore++;
      g.status = '실시간';
    }
  });
  renderGames();
}

// 초기 렌더 + 주기적 업데이트
function init(){
  // 연도 자동 채우기
  const yEl = document.getElementById('year');
  if(yEl) yEl.textContent = new Date().getFullYear();

  renderGames();
  renderStandings();
  renderSchedule();
  renderNews();
  renderTeams();

  // 10초마다 실시간 시뮬(데모)
  setInterval(simulateLive, 10000);
}

document.addEventListener('DOMContentLoaded', init);
