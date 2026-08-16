// KNL 홈페이지용 스크립트
// 이미지 기준 순위 반영된 standings 포함

const teams = [
  { id: 1, name: 'Yomiuri Giants', abbr: 'YGI' },
  { id: 2, name: 'Kiwoom Heroes',  abbr: 'KHW' }
];

const standings = [
  { teamId: 1, gp: 2, w: 1, l: 1, d: 0, r: 6, ra: 1, rd: 5, streak: 'L1' },
  { teamId: 2, gp: 2, w: 1, l: 1, d: 0, r: 1, ra: 6, rd: -5, streak: 'W1' }
];

const games = [
  { id: 101, home: 1, away: 2, homeScore: 3, awayScore: 2, status: '9회말 2아웃' }
];

const news = [
  { id: 1, title: 'KNL, 신인 드래프트 개최 확정', excerpt: 'KNL 리그가 올해 드래프트 일정을 공개했습니다.' },
  { id: 2, title: '서울 라이온즈, 외국인 투수 영입', excerpt: '서울이 북미 리그 출신 좌완을 영입했습니다.' }
];

function tName(id) { const t = teams.find(x => x.id === id); return t ? t.name : '---'; }

function formatScheduleTeams(){
  document.querySelectorAll('.schedule-table tbody td.teams-col').forEach(cell => {
    const text = cell.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    const scored = text.match(/^(.+?)\s+(\d+)\s+vs\s+(\d+)\s+(.+)$/);
    const scheduled = text.match(/^(.+?)\s+vs\s+(.+)$/);

    if (scored) {
      const team1 = scored[1].trim();
      const score1 = Number(scored[2]);
      const score2 = Number(scored[3]);
      const team2 = scored[4].trim();

      cell.innerHTML = `
        <strong>${team1}</strong>
        <span class="score ${score1 > score2 ? 'win' : score1 < score2 ? 'lose' : ''}">${score1}</span>
        <span class="vs">vs</span>
        <span class="score ${score2 > score1 ? 'win' : score2 < score1 ? 'lose' : ''}">${score2}</span>
        <strong>${team2}</strong>
      `;
    } else if (scheduled) {
      const team1 = scheduled[1].trim();
      const team2 = scheduled[2].trim();

      cell.innerHTML = `
        <strong>${team1}</strong>
        <span class="score"></span>
        <span class="vs">vs</span>
        <span class="score"></span>
        <strong>${team2}</strong>
      `;
    }
  });
}

// 월 선택에 따라 해당 월의 경기만 표시
function setupScheduleMonth(){
  const select = document.querySelector('.controls select[aria-label="월 선택"]');
  const rows = document.querySelectorAll('.schedule-table tbody tr[data-month]');
  if(!select || !rows.length) return;

  function showMonth(month){
    rows.forEach(row => {
      const dateCell = row.querySelector('td');
      const day = dateCell ? parseInt(dateCell.textContent.match(/\.(\d+)/)?.[1] || '0', 10) : 0;
      const isSeptemberAfter23 = month === '09' && day > 23;
      row.style.display = row.dataset.month === month && !isSeptemberAfter23 ? '' : 'none';
    });
  }

  select.value = select.value || '08';
  showMonth(select.value);
  select.addEventListener('change', () => showMonth(select.value));
}

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

function renderStandings() {
  const tbody = document.querySelector('#standings-table tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
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
      <td>${idx + 1}</td><td>${tName(s.teamId)}</td><td>${s.w}</td><td>${s.l}</td>
      <td>${s.d ?? 0}</td><td>${pct}</td><td>${s.r ?? '-'}</td><td>${s.ra ?? '-'}</td>
      <td>${s.rd ?? '-'}</td><td>${s.streak ?? '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

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

function setupDisclaimer(){
  try {
    const disclaimer = document.getElementById('site-disclaimer');
    const closeBtn = document.querySelector('.site-disclaimer__close');
    if(!disclaimer || !closeBtn) return;
    if (localStorage.getItem('knl_disclaimer_hidden') === '1'){
      disclaimer.style.display = 'none';
      return;
    }
    closeBtn.addEventListener('click', function(e){
      e.stopPropagation();
      disclaimer.style.transition = 'opacity 220ms ease, transform 220ms ease';
      disclaimer.style.opacity = '0';
      disclaimer.style.transform = 'translateY(6px)';
      setTimeout(function(){ disclaimer.style.display = 'none'; }, 240);
      try { localStorage.setItem('knl_disclaimer_hidden', '1'); } catch(err){}
    });
  } catch(err) {
    console.error('setupDisclaimer error', err);
  }
}

function init(){
  const yEl = document.getElementById('year');
  if(yEl) yEl.textContent = new Date().getFullYear();

  formatScheduleTeams();
  setupScheduleMonth();
  renderGames();
  renderStandings();
  renderSchedule();
  renderNews();
  renderTeams();
  setupDisclaimer();

  setInterval(simulateLive, 10000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
