/**
 * Data Service — Attempts & Progress (SQLite)
 * Provides helper functions to save practice attempts and read analytics.
 * Exports:
 *  - recordAttempt(a): Save a single attempt (maps Arabic letter → letter id).
 *  - getPerLetterStats(userId): Attempts, correct count, and accuracy per letter.
 *  - getTotals(userId): Overall attempts, correct, and accuracy for the user.
 *  - getLast7Days(userId): Daily counts/accuracy for the last 7 days.
 *  - getLast7DaysForLetters(userId, letters): Same as above, filtered to given letters.
 *  - getRecentAttempts(userId, limit): Latest attempts with target/predicted letters.
 *  - computeAndUpdateLevel(userId): Computes level from thresholds and stores it.
 *  - getCurrentLevel(userId): Reads the user’s current level.
 * Notes: timestamps are stored in UTC ISO strings; boolean `correct` is saved as 0/1.
 */

import { db } from "../db/schema";

export type NewAttempt = {
  userId: string;
  targetLetterAr: string;
  predictedLetterAr?: string | null;
  correct: boolean;
  confidence?: number | null;
  durationMs?: number | null;
  audioUri?: string | null;
};

function letterIdByAr(ar: string): number {
  const row = db.getFirstSync<{ id: number }>("SELECT id FROM letters WHERE ar = ?;", [ar]);
  if (!row) throw new Error("Unknown letter: " + ar);
  return row.id;
}

export function recordAttempt(a: NewAttempt) {
  const targetId = letterIdByAr(a.targetLetterAr);
  const predId = a.predictedLetterAr ? letterIdByAr(a.predictedLetterAr) : null;

  db.prepareSync(`
    INSERT INTO attempts (user_id, target_letter_id, predicted_letter_id, correct, confidence, duration_ms, audio_uri, created_at)
    VALUES (?,?,?,?,?,?,?, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
  `).executeSync([
    a.userId,
    targetId,
    predId,
    a.correct ? 1 : 0,
    a.confidence ?? null,
    a.durationMs ?? null,
    a.audioUri ?? null,
  ]);
}

export type PerLetter = { ar: string; n: number; correct: number; acc: number };

export function getPerLetterStats(userId: string): PerLetter[] {
  const rows = db.getAllSync<PerLetter & { letter_id: number }>(
    `
    SELECT l.id as letter_id, l.ar,
           COUNT(a.id) as n,
           SUM(a.correct) as correct,
           CASE WHEN COUNT(a.id)=0 THEN 0.0 
                ELSE CAST(SUM(a.correct) AS REAL)/COUNT(a.id) END as acc
    FROM letters l
    LEFT JOIN attempts a ON a.target_letter_id = l.id AND a.user_id = ?
    GROUP BY l.id
    ORDER BY l.order_index;
  `,
    [userId]
  );
  return rows.map((r) => ({
    ar: r.ar,
    n: r.n ?? 0,
    correct: r.correct ?? 0,
    acc: r.acc ?? 0,
  }));
}

export function getTotals(userId: string) {
  const r = db.getFirstSync<{ n: number; correct: number }>(
    `SELECT COUNT(*) as n, SUM(correct) as correct FROM attempts WHERE user_id = ?;`,
    [userId]
  )!;
  const n = r.n ?? 0;
  const correct = r.correct ?? 0;
  return { n, correct, acc: n ? correct / n : 0 };
}

export function getLast7Days(userId: string) {
  return db.getAllSync<{ day: string; n: number; acc: number }>(
    `
    SELECT substr(created_at, 1, 10) as day,
           COUNT(*) as n,
           CASE WHEN COUNT(*)=0 THEN 0.0 ELSE CAST(SUM(correct) AS REAL)/COUNT(*) END as acc
    FROM attempts
    WHERE user_id = ?
      AND created_at >= (datetime('now', '-7 days'))
    GROUP BY day
    ORDER BY day ASC;
  `,
    [userId]
  );
}

export function getLast7DaysForLetters(userId: string, letterNames: string[]) {
  if (!letterNames?.length) return [] as { day: string; n: number; acc: number }[];

  const placeholders = letterNames.map(() => '?').join(',');
  const sql = `
    SELECT substr(a.created_at, 1, 10) AS day,
           COUNT(*) AS n,
           CASE WHEN COUNT(*)=0 THEN 0.0 ELSE AVG(CAST(a.correct AS REAL)) END AS acc
    FROM attempts a
    JOIN letters l ON l.id = a.target_letter_id
    WHERE a.user_id = ?
      AND a.created_at >= (datetime('now', '-7 days'))
      AND l.ar IN (${placeholders})
    GROUP BY day
    ORDER BY day ASC;
  `;
  return db.getAllSync<{ day: string; n: number; acc: number }>(sql, [userId, ...letterNames]);
}

export function getRecentAttempts(userId: string, limit = 5) {
  return db.getAllSync<{
    created_at: string;
    correct: number;
    target_ar: string;
    predicted_ar: string | null;
    confidence: number | null;
  }>(
    `
    SELECT a.created_at, a.correct, a.confidence,
           lt.ar AS target_ar, lp.ar AS predicted_ar
    FROM attempts a
    JOIN letters lt ON lt.id = a.target_letter_id
    LEFT JOIN letters lp ON lp.id = a.predicted_letter_id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?;
    `,
    [userId, limit]
  );
}

export function computeAndUpdateLevel(userId: string) {
  const { n, acc } = getTotals(userId);
  const lvls = db.getAllSync<{ level: number; min_accuracy: number; min_attempts: number }>(
    "SELECT * FROM levels ORDER BY level ASC;"
  );

  let best = 1;
  for (const L of lvls) {
    if (n >= L.min_attempts && acc >= L.min_accuracy) best = L.level;
  }

  const stmt = db.prepareSync(`
    INSERT INTO user_levels(user_id, level)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE 
      SET level=excluded.level, 
          updated_at=(strftime('%Y-%m-%dT%H:%M:%fZ','now'));
  `);
  stmt.executeSync([userId, best]);
  stmt.finalizeSync();

  return best;
}

export function getCurrentLevel(userId: string) {
  const v = db.getFirstSync<{ level: number }>(
    "SELECT level FROM user_levels WHERE user_id = ?;",
    [userId]
  );
  return v?.level ?? 1;
}
