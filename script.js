// ============================================================
// script.js — core game logic
// ============================================================

// ── Scoring ──────────────────────────────────────────────────

function getResult(a, b) {
  return a > b ? "A" : b > a ? "B" : "D";
}

function calculatePoints(predicted, actual) {
  const pA = +predicted.scoreA, pB = +predicted.scoreB;
  const aA = +actual.scoreA,   aB = +actual.scoreB;
  let points = 0;
  const breakdown = [];

  if (getResult(pA, pB) === getResult(aA, aB)) {
    points += 3; breakdown.push({ label: "Correct result", pts: 3 });
  }
  if (pA === aA && pB === aB) {
    points += 5; breakdown.push({ label: "Exact score", pts: 5 });
  }
  if (pA - pB === aA - aB) {
    points += 2; breakdown.push({ label: "Correct goal diff", pts: 2 });
  }
  if (pA + pB === aA + aB) {
    points += 2; breakdown.push({ label: "Correct total goals", pts: 2 });
  }
  if (isUnderdogWin(aA, aB) && isUnderdogWin(pA, pB)) {
    points += 2; breakdown.push({ label: "Underdog win bonus", pts: 2 });
  }

  return { points, breakdown };
}

// ── Prediction ───────────────────────────────────────────────

function savePrediction(playerId, matchId, scoreA, scoreB) {
  const matches = loadMatches();
  const match = matches.find(m => m.matchId === matchId);
  if (!match || match.isFinalized) return false;
  if (!match.predictions) match.predictions = {};
  match.predictions[playerId] = { scoreA: +scoreA, scoreB: +scoreB };
  saveMatches(matches);
  return true;
}

// ── Results calculation ───────────────────────────────────────

function finalizeMatch(matchId, scoreA, scoreB) {
  const matches = loadMatches();
  const match = matches.find(m => m.matchId === matchId);
  if (!match) return false;

  match.actualScore  = { scoreA: +scoreA, scoreB: +scoreB };
  match.isFinalized  = true;
  saveMatches(matches);

  const players = loadPlayers();
  const predictions = match.predictions || {};

  players.forEach(player => {
    const pred = predictions[player.id];
    if (!pred) return;

    const { points, breakdown } = calculatePoints(pred, match.actualScore);

    // Remove stale entry if match is re-finalized
    const old = (player.predictionHistory || []).find(h => h.matchId === matchId);
    if (old) {
      player.totalPoints -= old.points;
      player.predictionHistory = player.predictionHistory.filter(h => h.matchId !== matchId);
    }

    player.totalPoints = (player.totalPoints || 0) + points;
    if (!player.predictionHistory) player.predictionHistory = [];
    player.predictionHistory.push({ matchId, predicted: pred, actual: match.actualScore, points, breakdown });
  });

  savePlayers(players);
  return true;
}

// ── Leaderboard ───────────────────────────────────────────────

function getSortedLeaderboard() {
  return loadPlayers().sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
}

function updateLeaderboard() {
  const container = document.getElementById("leaderboard-body");
  if (!container) return;

  const players = getSortedLeaderboard();
  if (players.length === 0) {
    container.innerHTML = '<p class="empty-state">No players registered yet. Join on the <a href="matches.html" style="color:var(--neon)">Predictions</a> page!</p>';
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const cls    = ["gold", "silver", "bronze"];

  container.innerHTML = "";
  players.forEach((p, i) => {
    const rank = i + 1;
    const row  = document.createElement("div");
    row.className = "lb-row" + (rank <= 3 ? ` rank-${cls[i]}` : "");
    row.innerHTML = `
      <span class="lb-rank">${rank <= 3 ? medals[i] : rank}</span>
      <span class="lb-name">${escHtml(p.name)}</span>
      <span class="lb-pts">${p.totalPoints || 0} <small>pts</small></span>
    `;
    container.appendChild(row);
  });
}

// ── Matches page ──────────────────────────────────────────────

function renderMatchesByGroup(playerId) {
  const container = document.getElementById("matches-list");
  if (!container) return;

  const allMatches = loadMatches();
  container.innerHTML = "";

  // Build grouped view
  for (const [grpKey, teams] of Object.entries(WC2026_GROUPS)) {
    const grpMatches = allMatches.filter(m => m.group === grpKey);
    if (!grpMatches.length) continue;

    const section = document.createElement("div");
    section.className = "group-section";
    section.innerHTML = `
      <div class="group-label">
        <span class="group-tag">Group ${grpKey}</span>
        <span class="group-teams">${teams.map(t => `${FLAG[t]||""} ${t}`).join(" · ")}</span>
      </div>
    `;

    grpMatches.forEach(match => {
      section.appendChild(buildMatchCard(match, playerId));
    });

    container.appendChild(section);
  }

  // Admin-added matches without a WC group
  const extraMatches = allMatches.filter(m => !m.group || !WC2026_GROUPS[m.group]);
  if (extraMatches.length) {
    const extra = document.createElement("div");
    extra.className = "group-section";
    extra.innerHTML = `<div class="group-label"><span class="group-tag">Custom Matches</span></div>`;
    extraMatches.forEach(match => extra.appendChild(buildMatchCard(match, playerId)));
    container.appendChild(extra);
  }
}

function buildMatchCard(match, playerId) {
  const userPred  = playerId ? (match.predictions || {})[playerId] : null;
  const finalized = match.isFinalized;
  const fA = FLAG[match.teamA] || "🏳️";
  const fB = FLAG[match.teamB] || "🏳️";

  const card = document.createElement("div");
  card.className = "match-card" + (finalized ? " finalized" : "");

  const md = match.matchday ? `<span class="md-badge">MD${match.matchday}</span>` : "";
  const dt = match.date ? `<span class="match-date">${formatDate(match.date)}</span>` : "";

  card.innerHTML = `
    <div class="match-meta">${md}${dt}</div>
    <div class="match-header">
      <span class="team team-a">${fA} ${escHtml(match.teamA)}</span>
      <span class="vs-badge">VS</span>
      <span class="team team-b">${escHtml(match.teamB)} ${fB}</span>
    </div>
    ${finalized
      ? `<div class="match-result-badge">Final: ${match.actualScore.scoreA} – ${match.actualScore.scoreB}</div>`
      : !playerId
        ? `<p class="muted" style="text-align:center;font-size:.8rem;padding:8px 0">Select your name above to predict</p>`
        : `<div class="prediction-form">
            <div class="score-inputs">
              <div class="score-group">
                <label>${escHtml(match.teamA)}</label>
                <input type="number" min="0" max="20" class="score-input" id="pred-a-${match.matchId}"
                  value="${userPred !== null && userPred !== undefined ? userPred.scoreA : ""}" placeholder="0">
              </div>
              <span class="score-sep">–</span>
              <div class="score-group">
                <label>${escHtml(match.teamB)}</label>
                <input type="number" min="0" max="20" class="score-input" id="pred-b-${match.matchId}"
                  value="${userPred !== null && userPred !== undefined ? userPred.scoreB : ""}" placeholder="0">
              </div>
            </div>
            ${userPred ? `<div class="saved-badge">✓ Saved: ${userPred.scoreA} – ${userPred.scoreB}</div>` : ""}
            <button class="btn-predict" onclick="submitPrediction(${playerId},'${match.matchId}')">
              ${userPred ? "Update" : "Submit"} Prediction
            </button>
          </div>`
    }
  `;
  return card;
}

function submitPrediction(playerId, matchId) {
  const a = document.getElementById(`pred-a-${matchId}`);
  const b = document.getElementById(`pred-b-${matchId}`);
  if (!a || !b || a.value === "" || b.value === "") {
    showToast("Enter both scores first.", "error"); return;
  }
  if (savePrediction(playerId, matchId, a.value, b.value)) {
    showToast("Prediction saved!", "success");
    renderMatchesByGroup(playerId);
  } else {
    showToast("Match already finalized.", "error");
  }
}

// ── Results page ──────────────────────────────────────────────

function renderResults() {
  const container = document.getElementById("results-list");
  if (!container) return;

  const matches = loadMatches().filter(m => m.isFinalized);
  const players = loadPlayers();

  if (!matches.length) {
    container.innerHTML = '<p class="empty-state">No completed matches yet — check back after the admin finalizes results.</p>';
    return;
  }

  container.innerHTML = "";

  matches.forEach(match => {
    const fA = FLAG[match.teamA] || "🏳️";
    const fB = FLAG[match.teamB] || "🏳️";
    const section = document.createElement("div");
    section.className = "result-section";

    const rows = players.map(player => {
      const hist = (player.predictionHistory || []).find(h => h.matchId === match.matchId);
      if (!hist) return `<div class="result-row no-pred">
        <span class="res-name">${escHtml(player.name)}</span>
        <span class="res-pred muted">No prediction</span>
        <span class="res-pts muted">0</span>
        <span class="res-bd muted">—</span>
      </div>`;
      const bd = hist.breakdown.map(b => `${b.label} (+${b.pts})`).join(", ");
      return `<div class="result-row">
        <span class="res-name">${escHtml(player.name)}</span>
        <span class="res-pred">${hist.predicted.scoreA}–${hist.predicted.scoreB}</span>
        <span class="res-pts pts-flash">${hist.points} pts</span>
        <span class="res-bd">${bd}</span>
      </div>`;
    }).join("");

    section.innerHTML = `
      <div class="result-match-header">
        <span class="team-name">${fA} ${escHtml(match.teamA)}</span>
        <span class="actual-score">${match.actualScore.scoreA} – ${match.actualScore.scoreB}</span>
        <span class="team-name">${escHtml(match.teamB)} ${fB}</span>
      </div>
      <div class="result-meta" style="text-align:center;padding:6px 16px;font-size:.75rem;color:var(--text-muted);border-bottom:1px solid var(--border)">
        ${match.group ? `Group ${match.group} · ` : ""}${match.date ? formatDate(match.date) : ""}
      </div>
      <div class="result-table-head"><span>Player</span><span>Prediction</span><span>Points</span><span>Breakdown</span></div>
      <div class="result-rows">${rows || '<p class="empty-state" style="padding:20px">No predictions were submitted for this match.</p>'}</div>
    `;
    container.appendChild(section);
  });
}

// ── Admin panel ───────────────────────────────────────────────

function adminRenderMatchList() {
  const container = document.getElementById("admin-matches");
  if (!container) return;

  const matches  = loadMatches();
  container.innerHTML = "";

  // Group by WC group, then extras
  const grouped = {};
  const extras  = [];
  matches.forEach(m => {
    if (m.group && WC2026_GROUPS[m.group]) {
      if (!grouped[m.group]) grouped[m.group] = [];
      grouped[m.group].push(m);
    } else {
      extras.push(m);
    }
  });

  const renderGroupBlock = (label, list) => {
    const block = document.createElement("div");
    block.className = "admin-group-block";
    block.innerHTML = `<div class="admin-group-label">${label}</div>`;
    list.forEach(match => {
      const fA = FLAG[match.teamA] || "🏳️";
      const fB = FLAG[match.teamB] || "🏳️";
      const card = document.createElement("div");
      card.className = "admin-match-card" + (match.isFinalized ? " finalized" : "");
      card.innerHTML = `
        <div class="admin-match-title">
          ${fA} ${escHtml(match.teamA)}
          <span class="vs-badge">VS</span>
          ${escHtml(match.teamB)} ${fB}
          ${match.date ? `<span class="match-date-tag">${formatDate(match.date)}</span>` : ""}
          ${match.isFinalized ? `<span class="finalized-tag">Final: ${match.actualScore.scoreA}–${match.actualScore.scoreB}</span>` : ""}
        </div>
        ${!match.isFinalized ? `<div class="admin-score-row">
          <input type="number" min="0" max="20" id="adm-a-${match.matchId}" placeholder="${escHtml(match.teamA)}" class="admin-input">
          <span class="score-sep">–</span>
          <input type="number" min="0" max="20" id="adm-b-${match.matchId}" placeholder="${escHtml(match.teamB)}" class="admin-input">
          <button class="btn-finalize" onclick="adminFinalize('${match.matchId}')">Calculate Results</button>
        </div>` : ""}
      `;
      block.appendChild(card);
    });
    container.appendChild(block);
  };

  for (const [grp, list] of Object.entries(grouped)) {
    renderGroupBlock(`Group ${grp}`, list);
  }
  if (extras.length) renderGroupBlock("Custom Matches", extras);
}

function adminFinalize(matchId) {
  const a = document.getElementById(`adm-a-${matchId}`);
  const b = document.getElementById(`adm-b-${matchId}`);
  if (!a || !b || a.value === "" || b.value === "") {
    showToast("Enter both scores first.", "error"); return;
  }
  finalizeMatch(matchId, a.value, b.value);
  showToast("Match finalized — points calculated!", "success");
  adminRenderMatchList();
}

function adminAddMatch(e) {
  e.preventDefault();
  const tA = document.getElementById("new-team-a").value.trim();
  const tB = document.getElementById("new-team-b").value.trim();
  const dt = document.getElementById("new-match-date").value;
  if (!tA || !tB) { showToast("Enter both team names.", "error"); return; }
  const matches = loadMatches();
  matches.push(makeMatch("m" + Date.now(), null, null, tA, tB, dt || null));
  saveMatches(matches);
  showToast("Match added!", "success");
  document.getElementById("add-match-form").reset();
  adminRenderMatchList();
}

function adminResetData() {
  if (!confirm("Reset ALL data? This cannot be undone.")) return;
  localStorage.removeItem("ffpl_players");
  localStorage.removeItem("ffpl_matches");
  showToast("Data reset.", "success");
  setTimeout(() => location.reload(), 800);
}

// ── Player registration ───────────────────────────────────────

function initRegistration() {
  const form = document.getElementById("register-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const nameInput = document.getElementById("reg-name");
    const name = nameInput.value.trim();
    if (!name) { showToast("Enter your name.", "error"); return; }
    const player = registerPlayer(name);
    if (!player) { showToast("Could not register.", "error"); return; }
    localStorage.setItem("ffpl_active_player", player.id);
    nameInput.value = "";
    refreshActivePlayer();
    showToast(`Welcome, ${player.name}!`, "success");
  });
}

function refreshActivePlayer() {
  const savedId  = parseInt(localStorage.getItem("ffpl_active_player"), 10);
  const selector = document.getElementById("player-select");
  const banner   = document.getElementById("active-player-banner");

  // Rebuild selector
  if (selector) {
    const players = loadPlayers();
    selector.innerHTML = '<option value="">— Select your name —</option>';
    players.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === savedId) opt.selected = true;
      selector.appendChild(opt);
    });
    selector.onchange = () => {
      localStorage.setItem("ffpl_active_player", selector.value);
      renderMatchesByGroup(parseInt(selector.value, 10) || null);
      updateActiveBanner(selector.value ? loadPlayers().find(p => p.id === +selector.value) : null);
    };
  }

  const activePlayer = savedId ? loadPlayers().find(p => p.id === savedId) : null;
  updateActiveBanner(activePlayer);
  renderMatchesByGroup(activePlayer ? activePlayer.id : null);
}

function updateActiveBanner(player) {
  const banner = document.getElementById("active-player-banner");
  if (!banner) return;
  if (player) {
    banner.textContent = `Playing as: ${player.name}`;
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
  }
}

// ── Toast ─────────────────────────────────────────────────────

function showToast(msg, type = "info") {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ── Utility ───────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Page init ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "leaderboard") {
    updateLeaderboard();
    // Stat cards
    const players  = loadPlayers();
    const matches  = loadMatches();
    const done     = matches.filter(m => m.isFinalized).length;
    const topPts   = players.length ? Math.max(...players.map(p => p.totalPoints || 0)) : 0;
    const el = id => document.getElementById(id);
    if (el("stat-players"))  el("stat-players").textContent  = players.length || "0";
    if (el("stat-matches"))  el("stat-matches").textContent  = done;
    if (el("stat-top"))      el("stat-top").textContent      = topPts;
    if (el("stat-total-m"))  el("stat-total-m").textContent  = matches.length;
    setInterval(updateLeaderboard, 5000);
  }

  if (page === "matches") {
    initRegistration();
    refreshActivePlayer();
  }

  if (page === "results") {
    renderResults();
  }

  if (page === "admin") {
    adminRenderMatchList();
    const form = document.getElementById("add-match-form");
    if (form) form.addEventListener("submit", adminAddMatch);
    const rb = document.getElementById("btn-reset");
    if (rb) rb.addEventListener("click", adminResetData);
  }
});
