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

// ── FIFA World Cup 2026 – Knockout Stage Rounds ───────────────
const WC2026_GROUPS = {
  'R32': 'Round of 32',
  'R16': 'Round of 16',
  'QF':  'Quarter-Finals',
  'SF':  'Semi-Finals',
  '3P':  'Third Place',
  'F':   'Final',
};

// Helper: get display name for a round ID
function getRoundName(roundId) {
  return WC2026_GROUPS[roundId] || roundId;
}

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

// ── All Knockout Stage matches — official FIFA WC 2026 schedule ─
// Kickoffs in UTC · shown in app as NPT (UTC+5:45)
// TBD matches: teams confirmed after previous round; locked for prediction until updated
function _buildMatches() {
  return [
    // ── ROUND OF 32 (all 16 teams confirmed) ─────────────────────
    { matchId:'M73', group:'R32', slot:1,  teamA:'South Africa',        teamB:'Canada',               kickoff:'2026-06-28T19:00:00Z' }, // NPT 00:45 Jun 29
    { matchId:'M76', group:'R32', slot:2,  teamA:'Brazil',              teamB:'Japan',                kickoff:'2026-06-29T17:00:00Z' }, // NPT 22:45 Jun 29
    { matchId:'M74', group:'R32', slot:3,  teamA:'Germany',             teamB:'Paraguay',             kickoff:'2026-06-29T20:30:00Z' }, // NPT 02:15 Jun 30
    { matchId:'M75', group:'R32', slot:4,  teamA:'Netherlands',         teamB:'Morocco',              kickoff:'2026-06-29T23:00:00Z' }, // NPT 04:45 Jun 30
    { matchId:'M78', group:'R32', slot:5,  teamA:'Ivory Coast',         teamB:'Norway',               kickoff:'2026-06-30T17:00:00Z' }, // NPT 22:45 Jun 30
    { matchId:'M77', group:'R32', slot:6,  teamA:'France',              teamB:'Sweden',               kickoff:'2026-06-30T21:00:00Z' }, // NPT 02:45 Jul 01
    { matchId:'M79', group:'R32', slot:7,  teamA:'Mexico',              teamB:'Ecuador',              kickoff:'2026-06-30T23:00:00Z' }, // NPT 04:45 Jul 01
    { matchId:'M80', group:'R32', slot:8,  teamA:'England',             teamB:'DR Congo',             kickoff:'2026-07-01T16:00:00Z' }, // NPT 21:45 Jul 01
    { matchId:'M82', group:'R32', slot:9,  teamA:'Belgium',             teamB:'Senegal',              kickoff:'2026-07-01T20:00:00Z' }, // NPT 01:45 Jul 02
    { matchId:'M81', group:'R32', slot:10, teamA:'USA',                 teamB:'Bosnia & Herzegovina', kickoff:'2026-07-01T22:00:00Z' }, // NPT 03:45 Jul 02
    { matchId:'M84', group:'R32', slot:11, teamA:'Spain',               teamB:'Austria',              kickoff:'2026-07-02T19:00:00Z' }, // NPT 00:45 Jul 03
    { matchId:'M83', group:'R32', slot:12, teamA:'Portugal',            teamB:'Croatia',              kickoff:'2026-07-02T23:00:00Z' }, // NPT 04:45 Jul 03
    { matchId:'M85', group:'R32', slot:13, teamA:'Switzerland',         teamB:'Algeria',              kickoff:'2026-07-03T03:00:00Z' }, // NPT 08:45 Jul 03
    { matchId:'M88', group:'R32', slot:14, teamA:'Australia',           teamB:'Egypt',                kickoff:'2026-07-03T18:00:00Z' }, // NPT 23:45 Jul 03
    { matchId:'M86', group:'R32', slot:15, teamA:'Argentina',           teamB:'Cape Verde',           kickoff:'2026-07-03T22:00:00Z' }, // NPT 03:45 Jul 04
    { matchId:'M87', group:'R32', slot:16, teamA:'Colombia',            teamB:'Ghana',                kickoff:'2026-07-04T01:30:00Z' }, // NPT 07:15 Jul 04

    // ── ROUND OF 16 (teams TBD — confirmed after R32) ────────────
    { matchId:'M90', group:'R16', slot:1,  teamA:'TBD', teamB:'TBD', fixture:'W-M73 vs W-M75', kickoff:'2026-07-04T17:00:00Z', tbd:true },
    { matchId:'M89', group:'R16', slot:2,  teamA:'TBD', teamB:'TBD', fixture:'W-M74 vs W-M77', kickoff:'2026-07-04T21:00:00Z', tbd:true },
    { matchId:'M91', group:'R16', slot:3,  teamA:'TBD', teamB:'TBD', fixture:'W-M76 vs W-M78', kickoff:'2026-07-05T20:00:00Z', tbd:true },
    { matchId:'M92', group:'R16', slot:4,  teamA:'TBD', teamB:'TBD', fixture:'W-M79 vs W-M80', kickoff:'2026-07-06T04:00:00Z', tbd:true },
    { matchId:'M93', group:'R16', slot:5,  teamA:'TBD', teamB:'TBD', fixture:'W-M83 vs W-M84', kickoff:'2026-07-06T19:00:00Z', tbd:true },
    { matchId:'M94', group:'R16', slot:6,  teamA:'TBD', teamB:'TBD', fixture:'W-M81 vs W-M82', kickoff:'2026-07-06T22:00:00Z', tbd:true },
    { matchId:'M95', group:'R16', slot:7,  teamA:'TBD', teamB:'TBD', fixture:'W-M86 vs W-M88', kickoff:'2026-07-07T16:00:00Z', tbd:true },
    { matchId:'M96', group:'R16', slot:8,  teamA:'TBD', teamB:'TBD', fixture:'W-M85 vs W-M87', kickoff:'2026-07-07T20:00:00Z', tbd:true },

    // ── QUARTER-FINALS ────────────────────────────────────────────
    { matchId:'M97',  group:'QF', slot:1, teamA:'TBD', teamB:'TBD', fixture:'W-M89 vs W-M90', kickoff:'2026-07-09T20:00:00Z', tbd:true },
    { matchId:'M98',  group:'QF', slot:2, teamA:'TBD', teamB:'TBD', fixture:'W-M93 vs W-M94', kickoff:'2026-07-10T19:00:00Z', tbd:true },
    { matchId:'M99',  group:'QF', slot:3, teamA:'TBD', teamB:'TBD', fixture:'W-M91 vs W-M92', kickoff:'2026-07-11T21:00:00Z', tbd:true },
    { matchId:'M100', group:'QF', slot:4, teamA:'TBD', teamB:'TBD', fixture:'W-M95 vs W-M96', kickoff:'2026-07-12T01:00:00Z', tbd:true },

    // ── SEMI-FINALS ───────────────────────────────────────────────
    { matchId:'M101', group:'SF', slot:1, teamA:'TBD', teamB:'TBD', fixture:'W-M97 vs W-M98',   kickoff:'2026-07-14T18:00:00Z', tbd:true },
    { matchId:'M102', group:'SF', slot:2, teamA:'TBD', teamB:'TBD', fixture:'W-M99 vs W-M100',  kickoff:'2026-07-15T19:00:00Z', tbd:true },

    // ── THIRD PLACE ───────────────────────────────────────────────
    { matchId:'M103', group:'3P', slot:1, teamA:'TBD', teamB:'TBD', fixture:'L-M101 vs L-M102', kickoff:'2026-07-18T21:00:00Z', tbd:true },

    // ── FINAL ─────────────────────────────────────────────────────
    { matchId:'M104', group:'F',  slot:1, teamA:'TBD', teamB:'TBD', fixture:'W-M101 vs W-M102', kickoff:'2026-07-19T19:00:00Z', tbd:true },
  ];
}
const ALL_MATCHES = _buildMatches(); // 32 knockout-stage matches

function getMatchById(id) { return ALL_MATCHES.find(m => m.matchId === id) || null; }
function isMatchLocked(match) { return new Date() >= new Date(new Date(match.kickoff).getTime() - 5 * 60 * 1000); }

// ── Scoring (shared by script.js & finalizeMatchResult) ───────
function getResult(a, b) { return a > b ? 'A' : b > a ? 'B' : 'D'; }

function calculatePoints(predicted, actual) {
  const pA = +predicted.scoreA, pB = +predicted.scoreB;
  const aA = +actual.scoreA,   aB = +actual.scoreB;
  let points = 0;
  const breakdown = [];

  if (getResult(pA, pB) === getResult(aA, aB))  { points += 3; breakdown.push({ label: 'Correct result (W/D/L)', pts: 3 }); }
  if (pA === aA && pB === aB)                    { points += 5; breakdown.push({ label: 'Exact score',            pts: 5 }); }

  // Penalty winner bonus: only when actual match went to penalties (draw after 90+ET)
  if (actual.penaltyWinner && actual.penaltyWinner !== 'none') {
    if (predicted.penaltyPick && predicted.penaltyPick === actual.penaltyWinner) {
      points += 2;
      breakdown.push({ label: 'Correct penalty winner', pts: 2 });
    }
  }

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
    .select('match_id, score_a, score_b, penalty_pick, points_earned, breakdown')
    .eq('player_id', playerId);
  if (error) throw error;
  const map = {};
  (data || []).forEach(p => { map[p.match_id] = p; });
  return map;
}

async function upsertPrediction(playerId, matchId, scoreA, scoreB, penaltyPick) {
  const row = { player_id: playerId, match_id: matchId,
                score_a: +scoreA, score_b: +scoreB,
                updated_at: new Date().toISOString() };
  if (penaltyPick) row.penalty_pick = penaltyPick;
  const { error } = await db.from('predictions').upsert(row, { onConflict: 'player_id,match_id' });
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

async function finalizeMatchResult(matchId, scoreA, scoreB, penaltyWinner) {
  const aA = +scoreA, aB = +scoreB;

  // 1. Upsert actual score into match_results
  const mrRow = { match_id: matchId, score_a: aA, score_b: aB,
                  is_finalized: true, finalized_at: new Date().toISOString() };
  if (penaltyWinner) mrRow.penalty_winner = penaltyWinner;
  const { error: mrErr } = await db.from('match_results').upsert(mrRow, { onConflict: 'match_id' });
  if (mrErr) throw mrErr;

  // 2. Fetch all predictions for this match
  const { data: preds, error: pErr } = await db
    .from('predictions')
    .select('id, player_id, score_a, score_b, penalty_pick')
    .eq('match_id', matchId);
  if (pErr) throw pErr;
  if (!preds || !preds.length) return { updated: 0 };

  // 3. Calculate & store points per prediction
  const playerSet = new Set();
  for (const pred of preds) {
    const { points, breakdown } = calculatePoints(
      { scoreA: pred.score_a, scoreB: pred.score_b, penaltyPick: pred.penalty_pick },
      { scoreA: aA, scoreB: aB, penaltyWinner: penaltyWinner || null }
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
