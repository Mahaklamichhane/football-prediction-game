// ============================================================
// data.js — FIFA World Cup 2026 data + localStorage helpers
// ============================================================

// ── FIFA World Cup 2026 Groups ────────────────────────────────
// 48 teams, 12 groups of 4. Draw held December 5, 2024.
const WC2026_GROUPS = {
  A: ["USA",         "Panama",       "Albania",        "Ukraine"],
  B: ["Mexico",      "Ecuador",      "Côte d'Ivoire",  "South Korea"],
  C: ["Canada",      "Morocco",      "Croatia",        "Australia"],
  D: ["Brazil",      "Colombia",     "Japan",          "South Africa"],
  E: ["Argentina",   "Nigeria",      "Serbia",         "Iraq"],
  F: ["France",      "DR Congo",     "Uruguay",        "Iran"],
  G: ["Spain",       "Cameroon",     "Switzerland",    "Saudi Arabia"],
  H: ["England",     "Senegal",      "Venezuela",      "Uzbekistan"],
  I: ["Germany",     "Egypt",        "Costa Rica",     "Jordan"],
  J: ["Portugal",    "Tanzania",     "Honduras",       "Indonesia"],
  K: ["Netherlands", "Bahrain",      "Denmark",        "New Zealand"],
  L: ["Belgium",     "Hungary",      "Turkey",         "Austria"],
};

// Matchday dates: MD1 = June 11–16, MD2 = June 17–22, MD3 = June 23–27
const GROUP_DATES = {
  A: { md1: "2026-06-11", md2: "2026-06-18", md3: "2026-06-25" },
  B: { md1: "2026-06-11", md2: "2026-06-18", md3: "2026-06-25" },
  C: { md1: "2026-06-12", md2: "2026-06-19", md3: "2026-06-25" },
  D: { md1: "2026-06-12", md2: "2026-06-19", md3: "2026-06-26" },
  E: { md1: "2026-06-13", md2: "2026-06-20", md3: "2026-06-26" },
  F: { md1: "2026-06-13", md2: "2026-06-20", md3: "2026-06-26" },
  G: { md1: "2026-06-14", md2: "2026-06-21", md3: "2026-06-27" },
  H: { md1: "2026-06-14", md2: "2026-06-21", md3: "2026-06-27" },
  I: { md1: "2026-06-15", md2: "2026-06-22", md3: "2026-06-27" },
  J: { md1: "2026-06-15", md2: "2026-06-22", md3: "2026-06-27" },
  K: { md1: "2026-06-16", md2: "2026-06-23", md3: "2026-06-27" },
  L: { md1: "2026-06-16", md2: "2026-06-23", md3: "2026-06-27" },
};

// Country flag emojis for display
const FLAG = {
  "USA": "🇺🇸", "Panama": "🇵🇦", "Albania": "🇦🇱", "Ukraine": "🇺🇦",
  "Mexico": "🇲🇽", "Ecuador": "🇪🇨", "Côte d'Ivoire": "🇨🇮", "South Korea": "🇰🇷",
  "Canada": "🇨🇦", "Morocco": "🇲🇦", "Croatia": "🇭🇷", "Australia": "🇦🇺",
  "Brazil": "🇧🇷", "Colombia": "🇨🇴", "Japan": "🇯🇵", "South Africa": "🇿🇦",
  "Argentina": "🇦🇷", "Nigeria": "🇳🇬", "Serbia": "🇷🇸", "Iraq": "🇮🇶",
  "France": "🇫🇷", "DR Congo": "🇨🇩", "Uruguay": "🇺🇾", "Iran": "🇮🇷",
  "Spain": "🇪🇸", "Cameroon": "🇨🇲", "Switzerland": "🇨🇭", "Saudi Arabia": "🇸🇦",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Senegal": "🇸🇳", "Venezuela": "🇻🇪", "Uzbekistan": "🇺🇿",
  "Germany": "🇩🇪", "Egypt": "🇪🇬", "Costa Rica": "🇨🇷", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "Tanzania": "🇹🇿", "Honduras": "🇭🇳", "Indonesia": "🇮🇩",
  "Netherlands": "🇳🇱", "Bahrain": "🇧🇭", "Denmark": "🇩🇰", "New Zealand": "🇳🇿",
  "Belgium": "🇧🇪", "Hungary": "🇭🇺", "Turkey": "🇹🇷", "Austria": "🇦🇹",
};

// ── Match generation ──────────────────────────────────────────
function generateGroupStageMatches() {
  const matches = [];
  for (const [grp, teams] of Object.entries(WC2026_GROUPS)) {
    const dates = GROUP_DATES[grp];
    const [t1, t2, t3, t4] = teams;

    // Matchday 1
    matches.push(makeMatch(`${grp}-1`, grp, 1, t1, t2, dates.md1));
    matches.push(makeMatch(`${grp}-2`, grp, 1, t3, t4, dates.md1));
    // Matchday 2
    matches.push(makeMatch(`${grp}-3`, grp, 2, t1, t3, dates.md2));
    matches.push(makeMatch(`${grp}-4`, grp, 2, t2, t4, dates.md2));
    // Matchday 3 (simultaneous — same date for fairness)
    matches.push(makeMatch(`${grp}-5`, grp, 3, t1, t4, dates.md3));
    matches.push(makeMatch(`${grp}-6`, grp, 3, t2, t3, dates.md3));
  }
  return matches;
}

function makeMatch(matchId, group, matchday, teamA, teamB, date) {
  return {
    matchId,
    group,
    matchday,
    teamA,
    teamB,
    date,
    actualScore: null,
    isFinalized: false,
    predictions: {},
  };
}

// ── Player helpers (dynamic — any number of players) ──────────

function loadPlayers() {
  const stored = localStorage.getItem("ffpl_players");
  return stored ? JSON.parse(stored) : [];
}

function savePlayers(players) {
  localStorage.setItem("ffpl_players", JSON.stringify(players));
}

function registerPlayer(name) {
  name = name.trim();
  if (!name) return null;
  const players = loadPlayers();
  const existing = players.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const player = {
    id: Date.now(),
    name,
    totalPoints: 0,
    predictionHistory: [],
    joinedAt: new Date().toISOString(),
  };
  players.push(player);
  savePlayers(players);
  return player;
}

function getPlayerById(id) {
  return loadPlayers().find(p => p.id === id) || null;
}

// Legacy aliases so script.js works with both old and new API
function loadUsers()  { return loadPlayers(); }
function saveUsers(u) { savePlayers(u); }
function getUserById(id) { return getPlayerById(id); }

// ── Data version — bump to force localStorage regeneration ────
const DATA_VERSION = "wc2026-v1";

function checkDataVersion() {
  if (localStorage.getItem("ffpl_data_version") !== DATA_VERSION) {
    // Fresh schema — wipe matches (keep players / predictions intact)
    localStorage.removeItem("ffpl_matches");
    localStorage.setItem("ffpl_data_version", DATA_VERSION);
  }
}
checkDataVersion();

// ── Match helpers ─────────────────────────────────────────────

function loadMatches() {
  const stored = localStorage.getItem("ffpl_matches");
  if (stored) return JSON.parse(stored);
  const fresh = generateGroupStageMatches();
  saveMatches(fresh);
  return fresh;
}

function saveMatches(matches) {
  localStorage.setItem("ffpl_matches", JSON.stringify(matches));
}

function getMatchById(matchId) {
  return loadMatches().find(m => m.matchId === matchId) || null;
}

// Underdog = teamB (away side)
function isUnderdogWin(scoreA, scoreB) {
  return scoreB > scoreA;
}

// Friendly date formatter
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
