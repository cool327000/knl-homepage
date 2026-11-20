/* KNL Discord OAuth + server-verified management permissions.
   Requires Supabase Auth (Discord provider) and the SQL schema in supabase-auth.sql. */
(function () {
  const state = { client: null, user: null, isOwner: false, approved: false, request: null, configured: false, ready: false };
  let clientPromise = null;
  const adminSelector = '#nav [data-page="admin"], #adminShortcut';
  const $ = (s, root=document) => root.querySelector(s);
  function configReady() {
    return window.KNL_SUPABASE_URL && !window.KNL_SUPABASE_URL.includes('YOUR-PROJECT') &&
      window.KNL_SUPABASE_ANON_KEY && !window.KNL_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
  }
  function setControls() {
    document.querySelectorAll(adminSelector).forEach(el => {
      el.style.setProperty('display', state.isOwner || state.approved ? '' : 'none', 'important');
    });
    let b = $('#knlAuthButton');
    if (!b) {
      const host = $('.top-actions');
      if (!host) return;
      b = document.createElement('button');
      b.id = 'knlAuthButton'; b.className = 'btn small';
      host.appendChild(b);
    }
    if (!state.configured) {
      b.textContent = '로그인 설정 필요'; b.disabled = true;
      b.title = '운영자가 Supabase와 Discord OAuth 설정을 완료해야 해.';
    } else if (!state.user) {
      b.textContent = 'Discord 로그인'; b.disabled = false; b.onclick = signIn;
    } else if (state.isOwner || state.approved) {
      b.textContent = 'Discord 로그아웃'; b.disabled = false; b.onclick = signOut;
    } else if (state.request?.status === 'pending') {
      b.textContent = '권한 승인 대기 중'; b.disabled = false; b.onclick = signOut;
    } else if (state.request?.status === 'rejected') {
      b.textContent = '요청 거절됨 · 재요청'; b.disabled = false; b.onclick = requestAccess;
    } else {
      b.textContent = '운영 권한 요청'; b.disabled = false; b.onclick = requestAccess;
    }
  }
  async function refreshAccess() {
    if (!state.client || !state.user) {
      state.isOwner = false; state.approved = false; state.request = null; setControls(); return;
    }
    const uid = state.user.id;
    const [ownerRes, requestRes] = await Promise.all([
      state.client.from('knl_admins').select('user_id').eq('user_id', uid).maybeSingle(),
      state.client.from('knl_access_requests').select('user_id,status,created_at').eq('user_id', uid).maybeSingle()
    ]);
    state.isOwner = !!ownerRes.data;
    state.request = requestRes.data || null;
    state.approved = state.request?.status === 'approved';
    state.ready = true;
    setControls();
    if (typeof window.render === 'function' && window.page === 'admin' && !(state.isOwner || state.approved)) {
      window.page = 'dashboard'; window.render();
    }
    renderRequestPanel();
  }
  async function signIn() {
    try {
      const client = await ensureClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;
    } catch (error) {
      console.error('KNL Discord sign-in failed:', error);
      alert('Discord 로그인 연결에 실패했어: ' + (error?.message || '잠시 후 다시 시도해줘.'));
    }
  }
  async function signOut() {
    if (!confirm('Discord 계정에서 로그아웃할까?')) return;
    const { error } = await state.client.auth.signOut();
    if (error) alert(error.message);
  }
  async function requestAccess() {
    if (!state.user) return signIn();
    if (state.request?.status === 'pending') return alert('이미 권한 승인 요청을 보냈어. 소유자의 승인을 기다려줘.');
    if (!confirm('KNL 운영관리 전체 기능에 대한 접근 권한을 요청할까?')) return;
    if (state.request?.status === 'rejected') {
      const del = await state.client.from('knl_access_requests').delete().eq('user_id', state.user.id);
      if (del.error) return alert('재요청 준비에 실패했어: ' + del.error.message);
    }
    const { error } = await state.client.from('knl_access_requests').insert({
      user_id: state.user.id,
      discord_name: state.user.user_metadata?.full_name || state.user.user_metadata?.name || 'Discord user',
      status: 'pending'
    });
    if (error) return alert('권한 요청에 실패했어. 설정 또는 데이터베이스 정책을 확인해줘. ' + error.message);
    await refreshAccess();
    alert('권한 요청을 보냈어. 소유자가 승인하면 운영관리 탭이 표시돼.');
  }
  async function decideRequest(uid, status) {
    if (!state.isOwner) return alert('사이트 소유자만 승인하거나 거절할 수 있어.');
    const { error } = await state.client.from('knl_access_requests')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: state.user.id })
      .eq('user_id', uid);
    if (error) return alert('처리 실패: ' + error.message);
    const oldPanel = $('#knlAccessRequests'); if (oldPanel) oldPanel.remove();
    await refreshAccess();
    if (typeof window.render === 'function') window.render();
  }
  async function renderRequestPanel() {
    if (!state.isOwner || !state.client) return;
    const app = $('#app');
    if (!app || !document.body.contains(app)) return;
    if (page !== 'admin') return;
    let panel = $('#knlAccessRequests');
    if (panel) return;
    panel = document.createElement('section');
    panel.id = 'knlAccessRequests'; panel.className = 'card';
    panel.style.marginTop = '16px';
    panel.innerHTML = '<div class="section-title"><h3>운영 권한 요청</h3><span>OWNER ONLY</span></div><div class="muted" style="font-size:11px">요청을 승인하면 해당 Discord 계정에 운영관리 전체 기능이 열려.</div><div id="knlRequestRows" style="margin-top:12px">요청을 불러오는 중…</div>';
    app.appendChild(panel);
    const { data, error } = await state.client.from('knl_access_requests')
      .select('user_id,discord_name,status,created_at').order('created_at', { ascending: false });
    const rows = $('#knlRequestRows', panel);
    if (error) { rows.textContent = '요청 목록을 불러오지 못했어: ' + error.message; return; }
    if (!data?.length) { rows.textContent = '아직 권한 요청이 없어.'; return; }
    rows.innerHTML = data.map(r => {
      const name = String(r.discord_name || 'Discord user').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const uid = String(r.user_id);
      const status = r.status === 'approved' ? '승인됨' : r.status === 'rejected' ? '거절됨' : '승인 대기';
      const buttons = r.status === 'pending'
        ? '<button class="btn small primary" data-knl-approve="'+uid+'">승인</button> <button class="btn small danger" data-knl-reject="'+uid+'">거절</button>'
        : r.status === 'approved' ? '<button class="btn small danger" data-knl-revoke="'+uid+'">권한 회수</button>' : '';
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eee;flex-wrap:wrap"><div><b>'+name+'</b><div class="muted" style="font-size:10px">'+uid+' · '+status+'</div></div><div>'+buttons+'</div></div>';
    }).join('');
  }
  document.addEventListener('click', async e => {
    const approve = e.target.closest('[data-knl-approve]');
    const reject = e.target.closest('[data-knl-reject]');
    const revoke = e.target.closest('[data-knl-revoke]');
    if (approve) await decideRequest(approve.dataset.knlApprove, 'approved');
    if (reject) await decideRequest(reject.dataset.knlReject, 'rejected');
    if (revoke) await decideRequest(revoke.dataset.knlRevoke, 'rejected');
    const adminLink = e.target.closest('#nav [data-page="admin"], #adminShortcut');
    if (adminLink && !(state.isOwner || state.approved)) {
      e.preventDefault(); e.stopImmediatePropagation();
      alert(state.user ? '운영 권한이 없어. Discord 로그인 후 권한을 요청해줘.' : '운영관리는 승인된 Discord 계정만 이용할 수 있어.');
    }
  }, true);
  const observer = new MutationObserver(() => {
    setControls();
    if (state.isOwner && page === 'admin') renderRequestPanel();
  });
  function loadSupabaseClient() {
    if (window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Supabase library timed out'));
      }, 10000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Supabase library failed to load')); };
      document.head.appendChild(script);
    });
  }
  function ensureClient() {
    if (state.client) return Promise.resolve(state.client);
    if (!clientPromise) {
      clientPromise = loadSupabaseClient().then(() => {
        if (!window.supabase?.createClient) throw new Error('Supabase client is unavailable');
        state.client = window.supabase.createClient(window.KNL_SUPABASE_URL, window.KNL_SUPABASE_ANON_KEY);
        return state.client;
      }).catch(error => {
        clientPromise = null;
        throw error;
      });
    }
    return clientPromise;
  }

  document.addEventListener('DOMContentLoaded', () => {
    state.configured = configReady();
    // Render an active login button immediately; do not make the button depend
    // on the Supabase CDN finishing its download.
    setControls();
    if (!state.configured) return;

    ensureClient().then(async client => {
      observer.observe(document.body, { childList: true, subtree: true });
      const { data: { session } } = await client.auth.getSession();
      state.user = session?.user || null;
      await refreshAccess();
      client.auth.onAuthStateChange(async (_event, sessionNow) => {
        state.user = sessionNow?.user || null;
        try { await refreshAccess(); }
        catch (error) { console.error('KNL access refresh failed:', error); }
      });
    }).catch(error => {
      // Keep the button enabled so sign-in can retry loading the auth library.
      setControls();
      console.warn('KNL authentication is temporarily unavailable; league pages remain usable.', error);
    });
  });
  window.KNLAccess = state;
})();