// ============================================================
// script.js  —  UI logic · Auth · Scoring display
// ============================================================

// ── Loading spinner helper ────────────────────────────────────
function spinnerHTML(msg = 'Connecting to 246 Impex Server…') {
  return `<div class="server-loader">
    <div class="spinner"></div>
    <p>${msg}</p>
  </div>`;
}

// ── Session helpers ───────────────────────────────────────────
function getSession()  {
  const id   = localStorage.getItem('ffpl_pid');
  const name = localStorage.getItem('ffpl_pname');
  return id ? { id, name } : null;
}
function setSession(p) {
  localStorage.setItem('ffpl_pid',   p.id);
  localStorage.setItem('ffpl_pname', p.name);
}
function clearSession() {
  localStorage.removeItem('ffpl_pid');
  localStorage.removeItem('ffpl_pname');
}

// ── Auth overlay ──────────────────────────────────────────────
function showAuthOverlay() {
  const el = document.getElementById('auth-overlay');
  if (el) el.classList.add('visible');
}
function hideAuthOverlay() {
  const el = document.getElementById('auth-overlay');
  if (el) el.classList.remove('visible');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const name  = document.getElementById('auth-name').value.trim();
  const phone = document.getElementById('auth-phone').value.trim();
  const btn   = document.getElementById('auth-btn');
  const err   = document.getElementById('auth-error');

  if (!name || !phone) { err.textContent = 'Please fill in both fields.'; return; }
  err.textContent = '';
  btn.disabled    = true;
  btn.textContent = 'Joining…';

  try {
    const player = await authPlayer(name, phone);
    setSession(player);
    hideAuthOverlay();
    showToast(`Welcome, ${player.name}! 👋`, 'success');
    initMatchesPage();
  } catch (ex) {
    console.error(ex);
    err.textContent = ex.message || 'Could not join. Please try again.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Join & Play';
  }
}

function handleLogout() {
  clearSession();
  showAuthOverlay();
  initMatchesPage();
}

// ── Leaderboard page ──────────────────────────────────────────
async function initLeaderboardPage() {
  const body = document.getElementById('lb-body');
  if (!body) return;

  try {
    const [players, stats] = await Promise.all([fetchLeaderboard(), fetchStats()]);

    setEl('stat-players',   stats.players);
    setEl('stat-completed', stats.completed);
    setEl('stat-total',     stats.total);
    setEl('stat-top',       stats.topScore);

    if (!players.length) {
      body.innerHTML = '<p class="empty-state">No players yet — be the first to <a href="matches.html">join</a>!</p>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const cls    = ['rank-gold', 'rank-silver', 'rank-bronze'];
    body.innerHTML = players.map((p, i) => `
      <div class="lb-row${i < 3 ? ' ' + cls[i] : ''}">
        <span class="lb-rank">${i < 3 ? medals[i] : i + 1}</span>
        <span class="lb-name">${esc(p.name)}</span>
        <span class="lb-pts">${p.total_points || 0}<small> pts</small></span>
      </div>`).join('');
  } catch (ex) {
    console.error(ex);
    if (body) body.innerHTML = '<p class="error-state">Could not reach the 246 Impex server. Please check your connection and try again.</p>';
  }
}

// ── Matches page ──────────────────────────────────────────────
async function initMatchesPage() {
  const session   = getSession();
  const banner    = document.getElementById('player-banner');
  const logoutBtn = document.getElementById('logout-btn');

  if (banner) {
    if (session) {
      const txt = banner.querySelector('#player-banner-text');
      if (txt) txt.textContent = `Playing as: ${session.name}`;
      else banner.childNodes[0].textContent = `Playing as: ${session.name}`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }
  if (logoutBtn) logoutBtn.style.display = session ? 'inline-flex' : 'none';

  const container = document.getElementById('matches-container');
  if (!container) return;
  container.innerHTML = spinnerHTML('Loading FIFA WC 2026 matches…');

  try {
    const [results, myPreds] = await Promise.all([
      fetchMatchResults(),
      session ? fetchMyPredictions(session.id) : Promise.resolve({}),
    ]);

    // Remember which tab was active before re-render
    const prevActive = container.querySelector('.grp-tab.active')?.dataset.group || 'A';
    container.innerHTML = '';

    // ── Group Tabs bar ──────────────────────────────────────
    const tabBar = document.createElement('div');
    tabBar.className = 'group-tabs';
    tabBar.innerHTML = Object.keys(WC2026_GROUPS).map(g =>
      `<button class="grp-tab${g === prevActive ? ' active' : ''}" data-group="${g}">Group ${g}</button>`
    ).join('');
    container.appendChild(tabBar);

    // ── Group sections (one per group, hidden unless active) ─
    for (const [grp, teams] of Object.entries(WC2026_GROUPS)) {
      const grpMatches = ALL_MATCHES.filter(m => m.group === grp);
      const sec = document.createElement('div');
      sec.className = 'group-section' + (grp === prevActive ? ' active' : '');
      sec.dataset.group = grp;
      sec.style.display = (grp === prevActive) ? 'block' : 'none'; // belt-and-suspenders: works even if CSS is stale

      // Info strip showing all 4 teams
      sec.innerHTML = `
        <div class="group-tab-info">
          <span class="group-badge">Group ${grp}</span>
          <span class="group-teams">${teams.map(t => `${FLAG[t] || ''} ${t}`).join(' &nbsp;·&nbsp; ')}</span>
        </div>`;

      const stack = document.createElement('div');
      stack.className = 'matches-stack';
      grpMatches.forEach(match => {
        stack.appendChild(buildMatchCard(match, results[match.matchId] || null, myPreds[match.matchId] || null, session));
      });
      sec.appendChild(stack);
      container.appendChild(sec);
    }

    // ── Tab click handler ────────────────────────────────────
    tabBar.querySelectorAll('.grp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabBar.querySelectorAll('.grp-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        container.querySelectorAll('.group-section').forEach(s => {
          const isActive = s.dataset.group === btn.dataset.group;
          s.classList.toggle('active', isActive);
          s.style.display = isActive ? 'block' : 'none'; // belt-and-suspenders
        });
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });

  } catch (ex) {
    console.error(ex);
    container.innerHTML = '<p class="error-state">Could not reach the 246 Impex server. Please check your connection and try again.</p>';
  }
}

function buildMatchCard(match, result, pred, session) {
  const locked    = isMatchLocked(match) || !!(result && result.is_finalized);
  const finalized = !!(result && result.is_finalized);
  const fA = FLAG[match.teamA] || '🏳';
  const fB = FLAG[match.teamB] || '🏳';

  let bodyHtml = '';

  if (finalized) {
    bodyHtml += `<div class="final-badge">Final Score: ${result.score_a} – ${result.score_b}</div>`;
    if (pred) {
      const bd = Array.isArray(pred.breakdown)
        ? pred.breakdown.map(b => `<span class="bd-item">+${b.pts} ${b.label}</span>`).join('')
        : '';
      bodyHtml += `<div class="my-pred finalized-pred">
        Your prediction: <strong>${pred.score_a}–${pred.score_b}</strong>
        &nbsp;·&nbsp; <span class="pts-tag">${pred.points_earned || 0} pts</span>
        ${bd ? `<div class="bd-list">${bd}</div>` : ''}
      </div>`;
    } else if (session) {
      bodyHtml += `<div class="my-pred no-pred-note">You did not predict this match.</div>`;
    }
  } else if (!session) {
    bodyHtml = `<p class="lock-note">
      <a href="#" onclick="showAuthOverlay();return false">Verify your identity</a> to submit a prediction.
    </p>`;
  } else if (locked) {
    bodyHtml = `<div class="lock-note">🔒 Predictions locked — match has started</div>`;
    if (pred) bodyHtml += `<div class="my-pred">Your saved prediction: <strong>${pred.score_a}–${pred.score_b}</strong></div>`;
  } else {
    // Open for prediction
    bodyHtml = `
      <div class="predict-form" id="form-${match.matchId}">
        <div class="score-row">
          <div class="score-col">
            <span class="score-label">${esc(match.teamA)}</span>
            <input type="number" min="0" max="20" class="score-in" id="pa-${match.matchId}"
              value="${pred !== null && pred !== undefined ? pred.score_a : ''}" placeholder="0">
          </div>
          <span class="score-dash">–</span>
          <div class="score-col">
            <span class="score-label">${esc(match.teamB)}</span>
            <input type="number" min="0" max="20" class="score-in" id="pb-${match.matchId}"
              value="${pred !== null && pred !== undefined ? pred.score_b : ''}" placeholder="0">
          </div>
        </div>
        ${pred ? `<div class="saved-pill">✓ Saved: ${pred.score_a}–${pred.score_b}</div>` : ''}
        <button class="btn-save" onclick="handleSavePred('${match.matchId}',this)">
          ${pred ? 'Update' : 'Submit'} Prediction
        </button>
      </div>`;
  }

  const card = document.createElement('div');
  card.className = `match-card${locked ? ' locked' : ''}${finalized ? ' finalized' : ''}`;
  card.innerHTML = `
    <div class="match-meta">
      <span class="md-chip">MD${match.matchday}</span>
      <span class="match-dt">${fmtDatetime(match.kickoff)}</span>
      ${locked && !finalized ? '<span class="lock-chip">🔒 Locked</span>' : ''}
    </div>
    <div class="match-teams">
      <span class="team-a">${fA} ${esc(match.teamA)}</span>
      <span class="vs-pill">VS</span>
      <span class="team-b">${esc(match.teamB)} ${fB}</span>
    </div>
    ${bodyHtml}`;
  return card;
}

async function handleSavePred(matchId, btn) {
  const session = getSession();
  if (!session) { showAuthOverlay(); return; }

  const a = document.getElementById(`pa-${matchId}`);
  const b = document.getElementById(`pb-${matchId}`);
  if (!a || !b || a.value === '' || b.value === '') {
    showToast('Enter both scores first.', 'error'); return;
  }

  const orig     = btn.textContent;
  btn.disabled   = true;
  btn.textContent = 'Saving…';

  try {
    await upsertPrediction(session.id, matchId, +a.value, +b.value);
    showToast('Prediction saved! ✓', 'success');
    initMatchesPage();
  } catch (ex) {
    console.error(ex);
    showToast('Save failed: ' + (ex.message || 'Try again.'), 'error');
    btn.disabled    = false;
    btn.textContent = orig;
  }
}

// ── Results page ──────────────────────────────────────────────
async function initResultsPage() {
  const container = document.getElementById('results-container');
  if (!container) return;
  container.innerHTML = spinnerHTML('Loading match results…');

  try {
    const data    = await fetchResultsData();
    const session = getSession();

    if (!data.length) {
      container.innerHTML = '<p class="empty-state">No completed matches yet — check back after kick-off!</p>';
      return;
    }

    container.innerHTML = '';
    data.forEach(({ result, match, predictions, players }) => {
      if (!match) return;
      const fA = FLAG[match.teamA] || '🏳';
      const fB = FLAG[match.teamB] || '🏳';

      const sorted = [...predictions].sort((a, b) => (b.points_earned || 0) - (a.points_earned || 0));

      const rows = sorted.map(pred => {
        const player = players.find(p => p.id === pred.player_id);
        if (!player) return '';
        const isMe = session && session.id === pred.player_id;
        const bd   = Array.isArray(pred.breakdown)
          ? pred.breakdown.map(b => `${b.label} (+${b.pts})`).join(', ')
          : '';
        return `<div class="res-row${isMe ? ' my-row' : ''}">
          <span class="rr-name">${esc(player.name)}${isMe ? ' <span class="you-tag">You</span>' : ''}</span>
          <span class="rr-pred">${pred.score_a}–${pred.score_b}</span>
          <span class="rr-pts">${pred.points_earned || 0} pts</span>
          <span class="rr-bd">${bd || '—'}</span>
        </div>`;
      }).join('');

      const sec = document.createElement('div');
      sec.className = 'result-section';
      sec.innerHTML = `
        <div class="result-header">
          <div class="rh-teams">
            <span>${fA} ${esc(match.teamA)}</span>
            <span class="rh-score">${result.score_a} – ${result.score_b}</span>
            <span>${esc(match.teamB)} ${fB}</span>
          </div>
          <div class="rh-meta">Group ${match.group} · MD${match.matchday} · ${fmtDate(match.kickoff)}</div>
        </div>
        <div class="res-table-head"><span>Player</span><span>Prediction</span><span>Points</span><span>Breakdown</span></div>
        <div class="res-rows">${rows || '<p class="empty-state-sm">No predictions were submitted for this match.</p>'}</div>`;
      container.appendChild(sec);
    });
  } catch (ex) {
    console.error(ex);
    container.innerHTML = '<p class="error-state">Could not reach the 246 Impex server. Please check your connection.</p>';
  }
}

// ── Admin page ────────────────────────────────────────────────
async function initAdminPage() {
  const container = document.getElementById('admin-matches');
  if (!container) return;
  container.innerHTML = spinnerHTML('Loading match data…');

  try {
    const results = await fetchMatchResults();
    container.innerHTML = '';

    for (const [grp, teams] of Object.entries(WC2026_GROUPS)) {
      const block = document.createElement('div');
      block.className = 'admin-group-block';
      block.innerHTML = `<div class="admin-grp-label">
        Group ${grp} — ${teams.map(t => `${FLAG[t] || ''} ${t}`).join(', ')}
      </div>`;

      ALL_MATCHES.filter(m => m.group === grp).forEach(match => {
        const result = results[match.matchId];
        const done   = result && result.is_finalized;
        const fA = FLAG[match.teamA] || '🏳';
        const fB = FLAG[match.teamB] || '🏳';

        const card = document.createElement('div');
        card.className = `adm-card${done ? ' done' : ''}`;
        card.id = `adm-card-${match.matchId}`;
        card.innerHTML = `
          <div class="adm-card-top">
            <div class="adm-teams">${fA} ${esc(match.teamA)} <span class="vs-sm">vs</span> ${esc(match.teamB)} ${fB}</div>
            <div class="adm-meta">MD${match.matchday} · ${fmtDatetime(match.kickoff)}</div>
            ${done ? `<span class="done-badge">✓ Final: ${result.score_a}–${result.score_b}</span>` : ''}
          </div>
          ${!done ? `<div class="adm-form">
            <input type="number" min="0" max="20" id="aa-${match.matchId}" class="adm-in" placeholder="${esc(match.teamA)} goals">
            <span class="adm-dash">–</span>
            <input type="number" min="0" max="20" id="ab-${match.matchId}" class="adm-in" placeholder="${esc(match.teamB)} goals">
            <button class="btn-calc" onclick="handleAdminFinalize('${match.matchId}',this)">Calculate Results</button>
          </div>` : ''}`;
        block.appendChild(card);
      });
      container.appendChild(block);
    }

    // Stats bar update
    const stats = await fetchStats();
    setEl('adm-stat-players',   stats.players);
    setEl('adm-stat-completed', stats.completed);
    setEl('adm-stat-pending',   stats.total - stats.completed);
  } catch (ex) {
    console.error(ex);
    container.innerHTML = '<p class="error-state">Could not reach the 246 Impex server. Please check your connection.</p>';
  }
}

async function handleAdminFinalize(matchId, btn) {
  const a = document.getElementById(`aa-${matchId}`);
  const b = document.getElementById(`ab-${matchId}`);
  if (!a || !b || a.value === '' || b.value === '') {
    showToast('Enter both scores first.', 'error'); return;
  }
  const orig    = btn.textContent;
  btn.disabled  = true;
  btn.textContent = 'Calculating…';

  try {
    const { updated } = await finalizeMatchResult(matchId, +a.value, +b.value);
    showToast(`✓ Finalized! Points updated for ${updated} player(s).`, 'success');
    initAdminPage();
  } catch (ex) {
    console.error(ex);
    showToast('Error: ' + (ex.message || 'Could not finalize.'), 'error');
    btn.disabled    = false;
    btn.textContent = orig;
  }
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Utils ─────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// ── Page router ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'leaderboard') {
    initLeaderboardPage();
    setInterval(initLeaderboardPage, 30_000);
  }

  if (page === 'matches') {
    const form = document.getElementById('auth-form');
    if (form) form.addEventListener('submit', handleAuthSubmit);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (!getSession()) showAuthOverlay();
    initMatchesPage();
  }

  if (page === 'results') {
    initResultsPage();
  }

  if (page === 'admin') {
    initAdminPage();
  }
});
