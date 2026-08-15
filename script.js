// 기본 더미 데이터 (나중에 실제 API로 바꿀 수 있음)
const teams = [
  {id:1,name:'서울 라이온즈',abbr:'SEO'},
  {id:2,name:'부산 타이탄즈',abbr:'BUS'},
  {id:3,name:'대구 윙스',abbr:'DAE'},
  {id:4,name:'광주 스톰',abbr:'GWJ'}
];

const standings = [
  {teamId:1,w:28,l:15,d:1},
  {teamId:3,w:24,l:19,d:1},
  {teamId:2,w:22,l:21,d:1},
  {teamId:4,w:18,l:25,d:1}
];

const games = [
  {id:101,home:1,away:2,homeScore:3,awayScore:2,status:'9회말 2아웃'},
  {id:102,home:3,away:4,homeScore:0,awayScore:0,status:'경기전 18:30'}
];

const news = [
  {id:1,title:'KNL, 신인 드래프트 개최 확정',excerpt:'KNL 리그가 올해 드래프트 일정을 공개했습니다.'},
  {id:2,title:'서울 라이온즈, 외국인 투수 영입',excerpt:'서울이 북미 리그 출신 좌완을 영입했습니다.'}
];

// 유틸: 팀 이름 찾기
function tName(id){ const t=teams.find(x=>x.id===id); return t? t.name : '---' }

// 경기 카드 렌더
function renderGames(){
  const el=document.getElementById('games');
  el.innerHTML = '';
  games.forEach(g=>{
    const card=document.createElement('div');
    card.className='game-card';
    card.innerHTML=`
      <div class="teams">
        <div class="team"><div class="name">${tName(g.away)}</div><div class="score">${g.awayScore}</div></div>
        <div class="status">${g.status}</div>
        <div class="team"><div class="score">${g.homeScore}</div><div class="name">${tName(g.home)}</div></div>
      </div>
    `;
    el.appendChild(card);
  });
}

// 순위 렌더
function renderStandings(){
  const tbody = document.querySelector('#standings-table tbody');
  tbody.innerHTML='';
  // 간단한 승률 계산
  standings.forEach((s,idx)=>{
    const tr=document.createElement('tr');
    const wp = ((s.w) / Math.max(1, (s.w + s.l))).toFixed(3).slice(1);
    tr.innerHTML=`
      <td>${idx+1}</td>
      <td>${tName(s.teamId)}</td>
      <td>${s.w}</td>
      <td>${s.l}</td>
      <td>${s.d}</td>
      <td>${wp}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 오늘 일정 렌더
function renderSchedule(){
  const ul = document.getElementById('today-schedule');
  ul.innerHTML='';
  games.forEach(g=>{
    const li=document.createElement('li');
    li.textContent = `${tName(g.away)} @ ${tName(g.home)} — ${g.status}`;
    ul.appendChild(li);
  });
}

// 뉴스 렌더
function renderNews(){
  const wrap = document.getElementById('news-carousel');
  wrap.innerHTML='';
  news.forEach(n=>{
    const d=document.createElement('div');
    d.className='news-item';
    d.innerHTML = `<h4>${n.title}</h4><p>${n.excerpt}</p>`;
    wrap.appendChild(d);
  });
}

// 팀 카드 렌더
function renderTeams(){
  const grid = document.getElementById('teams-grid');
  grid.innerHTML='';
  teams.forEach(t=>{
    const c=document.createElement('div');
    c.className='team-card';
    c.innerHTML = `<div class="badge">${t.abbr}</div><div class="team-name">${t.name}</div>`;
    grid.appendChild(c);
  });
}

// 실시간 시뮬레이션: 점수 랜덤 변동 (데모용)
function simulateLive(){
  // 경기 중인 것들만 랜덤 업데이트
  games.forEach(g=>{
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
  renderGames();
  renderStandings();
  renderSchedule();
  renderNews();
  renderTeams();

  // 10초마다 실시간 시뮬(데모)
  setInterval(simulateLive, 10000);
}

document.addEventListener('DOMContentLoaded', init);