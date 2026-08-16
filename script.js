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

// 리스트 / 달력 전환
function setupScheduleCalendar(){
  const tabs = document.querySelectorAll('.tabs .tab');
  const scheduleTable = document.querySelector('.schedule-table');
  const controls = document.querySelector('.controls');
  if(!tabs.length || !scheduleTable || !controls) return;

  const listTab = Array.from(tabs).find(t => t.textContent.trim() === '리스트');
  const calendarTab = Array.from(tabs).find(t => t.textContent.trim() === '달력');
  if(!listTab || !calendarTab) return;

  let calendar = document.getElementById('schedule-calendar');
  if(!calendar){
    calendar = document.createElement('div');
    calendar.id = 'schedule-calendar';
    calendar.style.display = 'none';
    calendar.style.marginTop = '10px';
    scheduleTable.parentNode.insertBefore(calendar, scheduleTable.nextSibling);
  }

  const style = document.createElement('style');
  style.textContent = `
    #schedule-calendar{width:100%;overflow-x:auto}
    #schedule-calendar table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
    #schedule-calendar th{height:38px;background:#f3f3f3;border:1px solid #ddd;text-align:center;font-weight:700}
    #schedule-calendar td{height:125px;vertical-align:top;border:1px solid #ddd;padding:6px 7px;background:#fff}
    #schedule-calendar td.empty{background:#fafafa}
    #schedule-calendar .day-number{font-size:13px;font-weight:700;text-align:center;margin-bottom:7px}
    #schedule-calendar .calendar-game{line-height:1.55;margin:2px 0;word-break:keep-all;text-align:left}
    #schedule-calendar .calendar-game .team{font-weight:500}
    #schedule-calendar .calendar-game .score{font-weight:700}
    #schedule-calendar .calendar-game .time{color:#777;font-size:10px;margin-left:2px}
    #schedule-calendar .calendar-game .ball{font-size:10px;color:#999}
    @media(max-width:800px){#schedule-calendar td{height:100px;padding:4px;font-size:10px}#schedule-calendar .day-number{font-size:12px}}
  `;
  document.head.appendChild(style);

  function parseGames(month){
    const rows = Array.from(scheduleTable.querySelectorAll('tbody tr[data-month="'+month+'"]'));
    const gamesByDay = {};
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const date = cells[0]?.textContent.trim() || '';
      const m = date.match(/\.(\d+)/);
      if(!m) return;
      const day = Number(m[1]);
      if(month === '09' && day > 23) return;
      const time = cells[1]?.textContent.trim() || '';
      const teamsText = cells[2]?.textContent.replace(/\s+/g,' ').trim() || '';
      let a = '', b = '', scoreA = '', scoreB = '';
      const scored = teamsText.match(/^(.+?)\s+(\d+)\s+vs\s+(\d+)\s+(.+)$/);
      const scheduled = teamsText.match(/^(.+?)\s+vs\s+(.+)$/);
      if(scored){ a=scored[1].trim(); scoreA=scored[2]; scoreB=scored[3]; b=scored[4].trim(); }
      else if(scheduled){ a=scheduled[1].trim(); b=scheduled[2].trim(); }
      (gamesByDay[day] ||= []).push({a,b,scoreA,scoreB,time});
    });
    return gamesByDay;
  }

  function renderCalendar(){
    const monthSelect = controls.querySelector('select[aria-label="월 선택"]');
    const yearSelect = controls.querySelector('select[aria-label="연도 선택"]');
    const month = monthSelect ? monthSelect.value : '08';
    const year = Number(yearSelect ? yearSelect.value : 2026);
    const monthIndex = Number(month)-1;
    const maxDay = month === '09' ? 23 : new Date(year, monthIndex+1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const gamesByDay = parseGames(month);
    const dayNames = ['일','월','화','수','목','금','토'];

    let html = '<table><thead><tr>' + dayNames.map(d => '<th>'+d+'</th>').join('') + '</tr></thead><tbody>';
    let day = 1;
    while(day <= maxDay){
      html += '<tr>';
      for(let col=0; col<7; col++){
        if((day === 1 && col < firstDay) || day > maxDay){
          html += '<td class="empty"></td>';
        } else {
          html += '<td><div class="day-number">'+day+'</div>';
          (gamesByDay[day] || []).forEach(g => {
            let result = '';
            if(g.scoreA !== '') result = ' <span class="score">'+g.scoreA+' vs '+g.scoreB+'</span>';
            html += '<div class="calendar-game"><span class="team">'+g.a+'</span>'+result+' <span class="team">'+g.b+'</span><span class="time"> '+g.time+'</span></div>';
          });
          html += '</td>';
          day++;
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    calendar.innerHTML = html;
  }

  function showList(){
    listTab.classList.add('active');
    calendarTab.classList.remove('active');
    scheduleTable.style.display = '';
    calendar.style.display = 'none';
  }

  function showCalendar(){
    calendarTab.classList.add('active');
    listTab.classList.remove('active');
    scheduleTable.style.display = 'none';
    calendar.style.display = 'block';
    renderCalendar();
  }

  listTab.addEventListener('click', showList);
  calendarTab.addEventListener('click', showCalendar);

  const monthSelect = controls.querySelector('select[aria-label="월 선택"]');
  const yearSelect = controls.querySelector('select[aria-label="연도 선택"]');
  if(monthSelect) monthSelect.addEventListener('change', () => { if(calendar.style.display !== 'none') renderCalendar(); });
  if(yearSelect) yearSelect.addEventListener('change', () => { if(calendar.style.display !== 'none') renderCalendar(); });
}

function init(){
  const yEl = document.getElementById('year');
  if(yEl) yEl.textContent = new Date().getFullYear();

  formatScheduleTeams();
  setupScheduleMonth();
  setupScheduleCalendar();
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
