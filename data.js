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

// ── FIFA World Cup 2026 – Real Groups (official draw) ─────────
const WC2026_GROUPS = {
  A: ['Mexico',      'South Africa',        'South Korea',   'Czech Republic'     ],
  B: ['Canada',      'Bosnia & Herzegovina','Qatar',         'Switzerland'        ],
  C: ['Brazil',      'Morocco',             'Haiti',         'Scotland'           ],
  D: ['USA',         'Paraguay',            'Australia',     'Turkey'             ],
  E: ['Germany',     'Curacao',             'Ivory Coast',   'Ecuador'            ],
  F: ['Netherlands', 'Japan',               'Sweden',        'Tunisia'            ],
  G: ['Belgium',     'Egypt',               'Iran',          'New Zealand'        ],
  H: ['Spain',       'Cape Verde',          'Saudi Arabia',  'Uruguay'            ],
  I: ['France',      'Senegal',             'Iraq',          'Norway'             ],
  J: ['Argentina',   'Algeria',             'Austria',       'Jordan'             ],
  K: ['Portugal',    'DR Congo',            'Uzbekistan',    'Colombia'           ],
  L: ['England',     'Croatia',             'Ghana',         'Panama'             ],
};

// Country flag emoji map (real WC2026 48 nations)
const FLAG = {
  // Group A
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czech Republic': '🇨🇿',
  // Group B
  'Canada': '🇨🇦', 'Bosnia & Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
  // Group C
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  // Group D
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  // Group E
  'Germany': '🇩🇪', 'Curacao': '🇨🇼', 'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨',
  // Group F
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  // Group G
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  // Group H
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  // Group I
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  // Group J
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  // Group K
  'Portugal': '🇵🇹', 'DR Congo': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  // Group L
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
};

// ── All 72 group-stage matches — real schedule, kickoffs in UTC ─
// Times shown in app as NPT (UTC+5:45)
function _buildMatches() {
  return [
    // ── GROUP A ──────────────────────────────────────────────────
    { matchId:'A-1', group:'A', matchday:1, teamA:'Mexico',               teamB:'South Africa',        kickoff:'2026-06-11T19:00:00Z' }, // NPT 00:45 Jun 12
    { matchId:'A-2', group:'A', matchday:1, teamA:'South Korea',          teamB:'Czech Republic',      kickoff:'2026-06-12T02:00:00Z' }, // NPT 07:45 Jun 12
    { matchId:'A-3', group:'A', matchday:2, teamA:'Czech Republic',       teamB:'South Africa',        kickoff:'2026-06-18T16:00:00Z' }, // NPT 21:45 Jun 18
    { matchId:'A-4', group:'A', matchday:2, teamA:'Mexico',               teamB:'South Korea',         kickoff:'2026-06-19T01:00:00Z' }, // NPT 06:45 Jun 19
    { matchId:'A-5', group:'A', matchday:3, teamA:'South Africa',         teamB:'South Korea',         kickoff:'2026-06-25T01:00:00Z' }, // NPT 06:45 Jun 25
    { matchId:'A-6', group:'A', matchday:3, teamA:'Czech Republic',       teamB:'Mexico',              kickoff:'2026-06-25T01:00:00Z' }, // NPT 06:45 Jun 25
    // ── GROUP B ──────────────────────────────────────────────────
    { matchId:'B-1', group:'B', matchday:1, teamA:'Canada',               teamB:'Bosnia & Herzegovina',kickoff:'2026-06-12T19:00:00Z' }, // NPT 00:45 Jun 13
    { matchId:'B-2', group:'B', matchday:1, teamA:'Qatar',                teamB:'Switzerland',         kickoff:'2026-06-13T19:00:00Z' }, // NPT 00:45 Jun 14
    { matchId:'B-3', group:'B', matchday:2, teamA:'Switzerland',          teamB:'Bosnia & Herzegovina',kickoff:'2026-06-18T19:00:00Z' }, // NPT 00:45 Jun 19
    { matchId:'B-4', group:'B', matchday:2, teamA:'Canada',               teamB:'Qatar',               kickoff:'2026-06-18T22:00:00Z' }, // NPT 03:45 Jun 19
    { matchId:'B-5', group:'B', matchday:3, teamA:'Switzerland',          teamB:'Canada',              kickoff:'2026-06-24T19:00:00Z' }, // NPT 00:45 Jun 25
    { matchId:'B-6', group:'B', matchday:3, teamA:'Bosnia & Herzegovina', teamB:'Qatar',               kickoff:'2026-06-24T19:00:00Z' }, // NPT 00:45 Jun 25
    // ── GROUP C ──────────────────────────────────────────────────
    { matchId:'C-1', group:'C', matchday:1, teamA:'Brazil',               teamB:'Morocco',             kickoff:'2026-06-13T22:00:00Z' }, // NPT 03:45 Jun 14
    { matchId:'C-2', group:'C', matchday:1, teamA:'Haiti',                teamB:'Scotland',            kickoff:'2026-06-14T01:00:00Z' }, // NPT 06:45 Jun 14
    { matchId:'C-3', group:'C', matchday:2, teamA:'Scotland',             teamB:'Morocco',             kickoff:'2026-06-19T22:00:00Z' }, // NPT 03:45 Jun 20
    { matchId:'C-4', group:'C', matchday:2, teamA:'Brazil',               teamB:'Haiti',               kickoff:'2026-06-20T00:30:00Z' }, // NPT 06:15 Jun 20
    { matchId:'C-5', group:'C', matchday:3, teamA:'Morocco',              teamB:'Haiti',               kickoff:'2026-06-24T22:00:00Z' }, // NPT 03:45 Jun 25
    { matchId:'C-6', group:'C', matchday:3, teamA:'Scotland',             teamB:'Brazil',              kickoff:'2026-06-24T22:00:00Z' }, // NPT 03:45 Jun 25
    // ── GROUP D ──────────────────────────────────────────────────
    { matchId:'D-1', group:'D', matchday:1, teamA:'USA',                  teamB:'Paraguay',            kickoff:'2026-06-13T01:00:00Z' }, // NPT 06:45 Jun 13
    { matchId:'D-2', group:'D', matchday:1, teamA:'Australia',            teamB:'Turkey',              kickoff:'2026-06-14T04:00:00Z' }, // NPT 09:45 Jun 14
    { matchId:'D-3', group:'D', matchday:2, teamA:'USA',                  teamB:'Australia',           kickoff:'2026-06-19T19:00:00Z' }, // NPT 00:45 Jun 20
    { matchId:'D-4', group:'D', matchday:2, teamA:'Turkey',               teamB:'Paraguay',            kickoff:'2026-06-20T03:00:00Z' }, // NPT 08:45 Jun 20
    { matchId:'D-5', group:'D', matchday:3, teamA:'Turkey',               teamB:'USA',                 kickoff:'2026-06-26T02:00:00Z' }, // NPT 07:45 Jun 26
    { matchId:'D-6', group:'D', matchday:3, teamA:'Paraguay',             teamB:'Australia',           kickoff:'2026-06-26T02:00:00Z' }, // NPT 07:45 Jun 26
    // ── GROUP E ──────────────────────────────────────────────────
    { matchId:'E-1', group:'E', matchday:1, teamA:'Germany',              teamB:'Curacao',             kickoff:'2026-06-14T17:00:00Z' }, // NPT 22:45 Jun 14
    { matchId:'E-2', group:'E', matchday:1, teamA:'Ivory Coast',          teamB:'Ecuador',             kickoff:'2026-06-14T23:00:00Z' }, // NPT 04:45 Jun 15
    { matchId:'E-3', group:'E', matchday:2, teamA:'Germany',              teamB:'Ivory Coast',         kickoff:'2026-06-20T20:00:00Z' }, // NPT 01:45 Jun 21
    { matchId:'E-4', group:'E', matchday:2, teamA:'Ecuador',              teamB:'Curacao',             kickoff:'2026-06-21T00:00:00Z' }, // NPT 05:45 Jun 21
    { matchId:'E-5', group:'E', matchday:3, teamA:'Curacao',              teamB:'Ivory Coast',         kickoff:'2026-06-25T20:00:00Z' }, // NPT 01:45 Jun 26
    { matchId:'E-6', group:'E', matchday:3, teamA:'Ecuador',              teamB:'Germany',             kickoff:'2026-06-25T20:00:00Z' }, // NPT 01:45 Jun 26
    // ── GROUP F ──────────────────────────────────────────────────
    { matchId:'F-1', group:'F', matchday:1, teamA:'Netherlands',          teamB:'Japan',               kickoff:'2026-06-14T20:00:00Z' }, // NPT 01:45 Jun 15
    { matchId:'F-2', group:'F', matchday:1, teamA:'Sweden',               teamB:'Tunisia',             kickoff:'2026-06-15T02:00:00Z' }, // NPT 07:45 Jun 15
    { matchId:'F-3', group:'F', matchday:2, teamA:'Netherlands',          teamB:'Sweden',              kickoff:'2026-06-20T17:00:00Z' }, // NPT 22:45 Jun 20
    { matchId:'F-4', group:'F', matchday:2, teamA:'Tunisia',              teamB:'Japan',               kickoff:'2026-06-21T04:00:00Z' }, // NPT 09:45 Jun 21
    { matchId:'F-5', group:'F', matchday:3, teamA:'Tunisia',              teamB:'Netherlands',         kickoff:'2026-06-25T23:00:00Z' }, // NPT 04:45 Jun 26
    { matchId:'F-6', group:'F', matchday:3, teamA:'Japan',                teamB:'Sweden',              kickoff:'2026-06-25T23:00:00Z' }, // NPT 04:45 Jun 26
    // ── GROUP G ──────────────────────────────────────────────────
    { matchId:'G-1', group:'G', matchday:1, teamA:'Belgium',              teamB:'Egypt',               kickoff:'2026-06-15T19:00:00Z' }, // NPT 00:45 Jun 16
    { matchId:'G-2', group:'G', matchday:1, teamA:'Iran',                 teamB:'New Zealand',         kickoff:'2026-06-16T01:00:00Z' }, // NPT 06:45 Jun 16
    { matchId:'G-3', group:'G', matchday:2, teamA:'Belgium',              teamB:'Iran',                kickoff:'2026-06-21T19:00:00Z' }, // NPT 00:45 Jun 22
    { matchId:'G-4', group:'G', matchday:2, teamA:'New Zealand',          teamB:'Egypt',               kickoff:'2026-06-22T01:00:00Z' }, // NPT 06:45 Jun 22
    { matchId:'G-5', group:'G', matchday:3, teamA:'New Zealand',          teamB:'Belgium',             kickoff:'2026-06-27T03:00:00Z' }, // NPT 08:45 Jun 27
    { matchId:'G-6', group:'G', matchday:3, teamA:'Egypt',                teamB:'Iran',                kickoff:'2026-06-27T03:00:00Z' }, // NPT 08:45 Jun 27
    // ── GROUP H ──────────────────────────────────────────────────
    { matchId:'H-1', group:'H', matchday:1, teamA:'Spain',                teamB:'Cape Verde',          kickoff:'2026-06-15T16:00:00Z' }, // NPT 21:45 Jun 15
    { matchId:'H-2', group:'H', matchday:1, teamA:'Saudi Arabia',         teamB:'Uruguay',             kickoff:'2026-06-15T22:00:00Z' }, // NPT 03:45 Jun 16
    { matchId:'H-3', group:'H', matchday:2, teamA:'Spain',                teamB:'Saudi Arabia',        kickoff:'2026-06-21T16:00:00Z' }, // NPT 21:45 Jun 21
    { matchId:'H-4', group:'H', matchday:2, teamA:'Uruguay',              teamB:'Cape Verde',          kickoff:'2026-06-21T22:00:00Z' }, // NPT 03:45 Jun 22
    { matchId:'H-5', group:'H', matchday:3, teamA:'Cape Verde',           teamB:'Saudi Arabia',        kickoff:'2026-06-27T00:00:00Z' }, // NPT 05:45 Jun 27
    { matchId:'H-6', group:'H', matchday:3, teamA:'Uruguay',              teamB:'Spain',               kickoff:'2026-06-27T00:00:00Z' }, // NPT 05:45 Jun 27
    // ── GROUP I ──────────────────────────────────────────────────
    { matchId:'I-1', group:'I', matchday:1, teamA:'France',               teamB:'Senegal',             kickoff:'2026-06-16T19:00:00Z' }, // NPT 00:45 Jun 17
    { matchId:'I-2', group:'I', matchday:1, teamA:'Iraq',                 teamB:'Norway',              kickoff:'2026-06-16T22:00:00Z' }, // NPT 03:45 Jun 17
    { matchId:'I-3', group:'I', matchday:2, teamA:'France',               teamB:'Iraq',                kickoff:'2026-06-22T21:00:00Z' }, // NPT 02:45 Jun 23
    { matchId:'I-4', group:'I', matchday:2, teamA:'Norway',               teamB:'Senegal',             kickoff:'2026-06-23T00:00:00Z' }, // NPT 05:45 Jun 23
    { matchId:'I-5', group:'I', matchday:3, teamA:'Norway',               teamB:'France',              kickoff:'2026-06-26T19:00:00Z' }, // NPT 00:45 Jun 27
    { matchId:'I-6', group:'I', matchday:3, teamA:'Senegal',              teamB:'Iraq',                kickoff:'2026-06-26T19:00:00Z' }, // NPT 00:45 Jun 27
    // ── GROUP J ──────────────────────────────────────────────────
    { matchId:'J-1', group:'J', matchday:1, teamA:'Argentina',            teamB:'Algeria',             kickoff:'2026-06-17T01:00:00Z' }, // NPT 06:45 Jun 17
    { matchId:'J-2', group:'J', matchday:1, teamA:'Austria',              teamB:'Jordan',              kickoff:'2026-06-17T04:00:00Z' }, // NPT 09:45 Jun 17
    { matchId:'J-3', group:'J', matchday:2, teamA:'Argentina',            teamB:'Austria',             kickoff:'2026-06-22T17:00:00Z' }, // NPT 22:45 Jun 22
    { matchId:'J-4', group:'J', matchday:2, teamA:'Jordan',               teamB:'Algeria',             kickoff:'2026-06-23T03:00:00Z' }, // NPT 08:45 Jun 23
    { matchId:'J-5', group:'J', matchday:3, teamA:'Algeria',              teamB:'Austria',             kickoff:'2026-06-28T02:00:00Z' }, // NPT 07:45 Jun 28
    { matchId:'J-6', group:'J', matchday:3, teamA:'Jordan',               teamB:'Argentina',           kickoff:'2026-06-28T02:00:00Z' }, // NPT 07:45 Jun 28
    // ── GROUP K ──────────────────────────────────────────────────
    { matchId:'K-1', group:'K', matchday:1, teamA:'Portugal',             teamB:'DR Congo',            kickoff:'2026-06-17T17:00:00Z' }, // NPT 22:45 Jun 17
    { matchId:'K-2', group:'K', matchday:1, teamA:'Uzbekistan',           teamB:'Colombia',            kickoff:'2026-06-18T02:00:00Z' }, // NPT 07:45 Jun 18
    { matchId:'K-3', group:'K', matchday:2, teamA:'Portugal',             teamB:'Uzbekistan',          kickoff:'2026-06-23T17:00:00Z' }, // NPT 22:45 Jun 23
    { matchId:'K-4', group:'K', matchday:2, teamA:'Colombia',             teamB:'DR Congo',            kickoff:'2026-06-24T02:00:00Z' }, // NPT 07:45 Jun 24
    { matchId:'K-5', group:'K', matchday:3, teamA:'Colombia',             teamB:'Portugal',            kickoff:'2026-06-27T23:30:00Z' }, // NPT 05:15 Jun 28
    { matchId:'K-6', group:'K', matchday:3, teamA:'DR Congo',             teamB:'Uzbekistan',          kickoff:'2026-06-27T23:30:00Z' }, // NPT 05:15 Jun 28
    // ── GROUP L ──────────────────────────────────────────────────
    { matchId:'L-1', group:'L', matchday:1, teamA:'England',              teamB:'Croatia',             kickoff:'2026-06-17T20:00:00Z' }, // NPT 01:45 Jun 18
    { matchId:'L-2', group:'L', matchday:1, teamA:'Ghana',                teamB:'Panama',              kickoff:'2026-06-17T23:00:00Z' }, // NPT 04:45 Jun 18
    { matchId:'L-3', group:'L', matchday:2, teamA:'England',              teamB:'Ghana',               kickoff:'2026-06-23T20:00:00Z' }, // NPT 01:45 Jun 24
    { matchId:'L-4', group:'L', matchday:2, teamA:'Panama',               teamB:'Croatia',             kickoff:'2026-06-23T23:00:00Z' }, // NPT 04:45 Jun 24
    { matchId:'L-5', group:'L', matchday:3, teamA:'Panama',               teamB:'England',             kickoff:'2026-06-27T21:00:00Z' }, // NPT 02:45 Jun 28
    { matchId:'L-6', group:'L', matchday:3, teamA:'Croatia',              teamB:'Ghana',               kickoff:'2026-06-27T21:00:00Z' }, // NPT 02:45 Jun 28
  ];
}
const ALL_MATCHES = _buildMatches(); // 72 real group-stage matches

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
  // Convert UTC → Nepal Time (UTC+5:45 = +345 minutes)
  const npt = new Date(new Date(iso).getTime() + 345 * 60 * 1000);
  return npt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
       + ' · '
       + npt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' NPT';
}
