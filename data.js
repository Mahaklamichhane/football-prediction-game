// ============================================================
// data.js  —  Supabase client · WC 2026 data · DB helpers
// ============================================================
//
// ── SUPABASE SETUP (run once in the Supabase SQL editor) ─────
//
//  create table if not exists players (
//    id           uuid default gen_random_uuid() primary key,
//    name         text not null,
//    phone_number text unique not null,
//    total_points integer default 0,
//    joined_at    timestamptz default now()
//  );
//
//  -- If upgrading from old schema (had bill_number), run:
//  alter table players add column if not exists phone_number text;
//  update players set phone_number = bill_number where phone_number is null;
//  alter table players alter column phone_number set not null;
//  alter table players add constraint players_phone_unique unique (phone_number);
//
//  create table if not exists predictions (
//    id             uuid default gen_random_uuid() primary key,
//    player_id      uuid references players(id) on delete cascade,
//    match_id       text not null,
//    score_a        integer not null,
//    score_b        integer not null,
//    points_earned  integer default 0,
//    breakdown      jsonb   default '[]',
//    updated_at     timestamptz default now(),
//    unique (player_id, match_id)
//  );
//
//  create table if not exists match_results (
//    match_id      text primary key,
//    score_a       integer,
//    score_b       integer,
//    is_finalized  boolean default false,
//    finalized_at  timestamptz
//  );
//
//  -- Disable RLS (this is a giveaway game — no auth needed):
//  alter table players       disable row level security;
//  alter table predictions   disable row level security;
//  alter table match_results disable row level security;
//
// ─────────────────────────────────────────────────────────────

// ── Supabase client ───────────────────────────────────────────
const SUPABASE_URL = 'https://eoobfvycquuvwrkpadwf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q8ZvJSp2NKZFCU8hvgLwlg_LRmg0rRD';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── FIFA World Cup 2026 – Groups ──────────────────────────────
const WC2026_GROUPS = {
  A: ['USA',         'Panama',       'Albania',       'Ukraine'     ],
  B: ['Mexico',      'Ecuador',      "Côte d'Ivoire", 'South Korea' ],
  C: ['Canada',      'Morocco',      'Croatia',       'Australia'   ],
  D: ['Brazil',      'Colombia',     'Japan',         'South Africa'],
  E: ['Argentina',   'Nigeria',      'Serbia',        'Iraq'        ],
  F: ['France',      'DR Congo',     'Uruguay',       'Iran'        ],
  G: ['Spain',       'Cameroon',     'Switzerland',   'Saudi Arabia'],
  H: ['England',     'Senegal',      'Venezuela',     'Uzbekistan'  ],
  I: ['Germany',     'Egypt',        'Costa Rica',    'Jordan'      ],
  J: ['Portugal',    'Tanzania',     'Honduras',      'Indonesia'   ],
  K: ['Netherlands', 'Bahrain',      'Denmark',       'New Zealand' ],
  L: ['Belgium',     'Hungary',      'Turkey',        'Austria'     ],
};

// Matchday dates per group (MD1 Jun 11-17, MD2 Jun 18-23, MD3 Jun 24-27)
const GROUP_MD = {
  A: { md1: '2026-06-11', md2: '2026-06-18', md3: '2026-06-25' },
  B: { md1: '2026-06-12', md2: '2026-06-18', md3: '2026-06-25' },
  C: { md1: '2026-06-12', md2: '2026-06-19', md3: '2026-06-25' },
  D: { md1: '2026-06-13', md2: '2026-06-19', md3: '2026-06-26' },
  E: { md1: '2026-06-13', md2: '2026-06-20', md3: '2026-06-26' },
  F: { md1: '2026-06-14', md2: '2026-06-20', md3: '2026-06-26' },
  G: { md1: '2026-06-14', md2: '2026-06-21', md3: '2026-06-27' },
  H: { md1: '2026-06-15', md2: '2026-06-21', md3: '2026-06-27' },
  I: { md1: '2026-06-15', md2: '2026-06-22', md3: '2026-06-27' },
  J: { md1: '2026-06-16', md2: '2026-06-22', md3: '2026-06-27' },
  K: { md1: '2026-06-16', md2: '2026-06-23', md3: '2026-06-27' },
  L: { md1: '2026-06-17', md2: '2026-06-23', md3: '2026-06-27' },
};

// Country flag emoji map
const FLAG = {
  'USA': '🇺🇸', 'Panama': '🇵🇦', 'Albania': '🇦🇱', 'Ukraine': '🇺🇦',
  'Mexico': '🇲🇽', 'Ecuador': '🇪🇨', "Côte d'Ivoire": '🇨🇮', 'South Korea': '🇰🇷',
  'Canada': '🇨🇦', 'Morocco': '🇲🇦', 'Croatia': '🇭🇷', 'Australia': '🇦🇺',
  'Brazil': '🇧🇷', 'Colombia': '🇨🇴', 'Japan': '🇯🇵', 'South Africa': '🇿🇦',
  'Argentina': '🇦🇷', 'Nigeria': '🇳🇬', 'Serbia': '🇷🇸', 'Iraq': '🇮🇶',
  'France': '🇫🇷', 'DR Congo': '🇨🇩', 'Uruguay': '🇺🇾', 'Iran': '🇮🇷',
  'Spain': '🇪🇸', 'Cameroon': '🇨🇲', 'Switzerland': '🇨🇭', 'Saudi Arabia': '🇸🇦',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Senegal': '🇸🇳', 'Venezuela': '🇻🇪', 'Uzbekistan': '🇺🇿',
  'Germany': '🇩🇪', 'Egypt': '🇪🇬', 'Costa Rica': '🇨🇷', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Tanzania': '🇹🇿', 'Honduras': '🇭🇳', 'Indonesia': '🇮🇩',
  'Netherlands': '🇳🇱', 'Bahrain': '🇧🇭', 'Denmark': '🇩🇰', 'New Zealand': '🇳🇿',
  'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Turkey': '🇹🇷', 'Austria': '🇦🇹',
};

// ── Static match generation (72 group-stage matches) ──────────
function _buildMatches() {
  const list = [];
  for (const [grp, [t1, t2, t3, t4]] of Object.entries(WC2026_GROUPS)) {
    const d = GROUP_MD[grp];
    // MD1
    list.push({ matchId: `${grp}-1`, group: grp, matchday: 1, teamA: t1, teamB: t2, kickoff: `${d.md1}T19:00:00Z` });
    list.push({ matchId: `${grp}-2`, group: grp, matchday: 1, teamA: t3, teamB: t4, kickoff: `${d.md1}T22:00:00Z` });
    // MD2
    list.push({ matchId: `${grp}-3`, group: grp, matchday: 2, teamA: t1, teamB: t3, kickoff: `${d.md2}T19:00:00Z` });
    list.push({ matchId: `${grp}-4`, group: grp, matchday: 2, teamA: t2, teamB: t4, kickoff: `${d.md2}T22:00:00Z` });
    // MD3 – simultaneous within each group
    list.push({ matchId: `${grp}-5`, group: grp, matchday: 3, teamA: t1, teamB: t4, kickoff: `${d.md3}T21:00:00Z` });
    list.push({ matchId: `${grp}-6`, group: grp, matchday: 3, teamA: t2, teamB: t3, kickoff: `${d.md3}T21:00:00Z` });
  }
  return list;
}
const ALL_MATCHES = _buildMatches(); // 72 static match objects

function getMatchById(id) { return ALL_MATCHES.find(m => m.matchId === id) || null; }
function isMatchLocked(match) { return new Date() >= new Date(match.kickoff); }

// ── Scoring (shared by script.js & finalizeMatchResult) ───────
function getResult(a, b) { return a > b ? 'A' : b > a ? 'B' : 'D'; }

function calculatePoints(predicted, actual) {
  const pA = +predicted.scoreA, pB = +predicted.scoreB;
  const aA = +actual.scoreA,   aB = +actual.scoreB;
  let points = 0;
  const breakdown = [];

  if (getResult(pA, pB) === getResult(aA, aB))  { points += 3; breakdown.push({ label: 'Correct result (W/D/L)', pts: 3 }); }
  if (pA === aA && pB === aB)                    { points += 5; breakdown.push({ label: 'Exact score',            pts: 5 }); }

  return { points, breakdown };
}

// ── Auth / Players ────────────────────────────────────────────
async function authPlayer(name, phoneNumber) {
  const phone = phoneNumber.trim();
  const nm    = name.trim();

  // Look up by phone_number (unique identifier)
  const { data: existing, error: findErr } = await db
    .from('players')
    .select('*')
    .eq('phone_number', phone)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    // Phone already registered — verify name matches
    if (existing.name.trim().toLowerCase() !== nm.toLowerCase()) {
      throw new Error('This phone number is already registered under a different name.');
    }
    return existing;
  }

  // New player → register with name + phone
  const { data: created, error: insErr } = await db
    .from('players')
    .insert({ name: nm, phone_number: phone, total_points: 0 })
    .select()
    .single();
  if (insErr) throw insErr;
  return created;
}

async function getPlayerById(id) {
  const { data, error } = await db.from('players').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// ── Leaderboard ───────────────────────────────────────────────
async function fetchLeaderboard() {
  const { data, error } = await db
    .from('players')
    .select('id, name, total_points')
    .order('total_points', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Predictions ───────────────────────────────────────────────
async function fetchMyPredictions(playerId) {
  const { data, error } = await db
    .from('predictions')
    .select('match_id, score_a, score_b, points_earned, breakdown')
    .eq('player_id', playerId);
  if (error) throw error;
  const map = {};
  (data || []).forEach(p => { map[p.match_id] = p; });
  return map;
}

async function upsertPrediction(playerId, matchId, scoreA, scoreB) {
  const { error } = await db
    .from('predictions')
    .upsert(
      { player_id: playerId, match_id: matchId,
        score_a: +scoreA, score_b: +scoreB,
        updated_at: new Date().toISOString() },
      { onConflict: 'player_id,match_id' }
    );
  if (error) throw error;
}

// ── Match results ─────────────────────────────────────────────
async function fetchMatchResults() {
  const { data, error } = await db.from('match_results').select('*');
  if (error) throw error;
  const map = {};
  (data || []).forEach(r => { map[r.match_id] = r; });
  return map;
}

async function finalizeMatchResult(matchId, scoreA, scoreB) {
  const aA = +scoreA, aB = +scoreB;

  // 1. Upsert actual score into match_results
  const { error: mrErr } = await db
    .from('match_results')
    .upsert({ match_id: matchId, score_a: aA, score_b: aB,
              is_finalized: true, finalized_at: new Date().toISOString() },
             { onConflict: 'match_id' });
  if (mrErr) throw mrErr;

  // 2. Fetch all predictions for this match
  const { data: preds, error: pErr } = await db
    .from('predictions')
    .select('id, player_id, score_a, score_b')
    .eq('match_id', matchId);
  if (pErr) throw pErr;
  if (!preds || !preds.length) return { updated: 0 };

  // 3. Calculate & store points per prediction
  const playerSet = new Set();
  for (const pred of preds) {
    const { points, breakdown } = calculatePoints(
      { scoreA: pred.score_a, scoreB: pred.score_b },
      { scoreA: aA, scoreB: aB }
    );
    await db.from('predictions')
      .update({ points_earned: points, breakdown })
      .eq('id', pred.id);
    playerSet.add(pred.player_id);
  }

  // 4. Recompute total_points for each affected player (sum of all their predictions)
  for (const pid of playerSet) {
    const { data: allP } = await db
      .from('predictions')
      .select('points_earned')
      .eq('player_id', pid);
    const total = (allP || []).reduce((s, p) => s + (p.points_earned || 0), 0);
    await db.from('players').update({ total_points: total }).eq('id', pid);
  }

  return { updated: preds.length };
}

// ── Results page ──────────────────────────────────────────────
async function fetchResultsData() {
  const { data: results, error: rErr } = await db
    .from('match_results')
    .select('*')
    .eq('is_finalized', true)
    .order('finalized_at', { ascending: false });
  if (rErr) throw rErr;
  if (!results || !results.length) return [];

  const matchIds = results.map(r => r.match_id);

  const [{ data: preds, error: pErr }, { data: players, error: plErr }] = await Promise.all([
    db.from('predictions').select('match_id,player_id,score_a,score_b,points_earned,breakdown').in('match_id', matchIds),
    db.from('players').select('id,name'),
  ]);
  if (pErr) throw pErr;
  if (plErr) throw plErr;

  return results.map(result => ({
    result,
    match: getMatchById(result.match_id),
    predictions: (preds || []).filter(p => p.match_id === result.match_id),
    players: players || [],
  }));
}

// ── Stats counts ──────────────────────────────────────────────
async function fetchStats() {
  const [lb, res] = await Promise.all([fetchLeaderboard(), fetchMatchResults()]);
  const completed = Object.values(res).filter(r => r.is_finalized).length;
  return {
    players:   lb.length,
    completed,
    topScore:  lb.length ? (lb[0].total_points || 0) : 0,
    total:     ALL_MATCHES.length,
  };
}

// ── Date helpers ──────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDatetime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
       + ' · '
       + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC';
}
