/**
 * Local Database Setup (SQLite)
 * Defines the app’s on-device database and applies schema updates.
 * Creates tables for users, letters, practice attempts, levels, and user progress.
 * On first run, seeds the canonical Arabic letters and default level thresholds.
 * Stores practice attempts (target/predicted letter, correct flag, confidence,
 * duration, audio URI) with timestamps for offline use and privacy.
 * Usage: call runMigrations() once at app startup to ensure the database is ready.
 */

import * as SQLite from "expo-sqlite";
export const db = SQLite.openDatabaseSync("qariai.db");

const CANON_LETTERS = [
  "الف","باء","تاء","ثاء","جيم","حاء","خاء","دال","ذال","راء","زاي",
  "سين","شين","صاد","ضاد","طاء","ظاء","عين","غين","فاء","قاف","كاف",
  "لام","ميم","نون","هاء","واو","ياء"
];

type Migration = { id: number; sql: string; post?: () => void };

const MIGRATIONS: Migration[] = [
  {
    id: 1,
    sql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS _meta (version INTEGER NOT NULL);
      DELETE FROM _meta;
      INSERT INTO _meta(version) VALUES (0);

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE IF NOT EXISTS letters (
        id INTEGER PRIMARY KEY,
        ar TEXT UNIQUE NOT NULL,
        en TEXT,
        order_index INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        target_letter_id INTEGER NOT NULL,
        predicted_letter_id INTEGER,     -- nullable if “uncertain”
        correct INTEGER NOT NULL,        -- 0/1
        confidence REAL,                 -- 0..1
        duration_ms INTEGER,
        audio_uri TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(target_letter_id) REFERENCES letters(id) ON DELETE RESTRICT,
        FOREIGN KEY(predicted_letter_id) REFERENCES letters(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_attempts_user        ON attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_user_date   ON attempts(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_attempts_user_letter ON attempts(user_id, target_letter_id);

      CREATE TABLE IF NOT EXISTS levels (
        level INTEGER PRIMARY KEY,
        min_accuracy REAL NOT NULL,   -- e.g., 0.70 for 70%
        min_attempts INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_levels (
        user_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(level) REFERENCES levels(level) ON DELETE RESTRICT
      );
    `,
    post: () => {
      const has = db.getFirstSync<{ n: number }>("SELECT COUNT(*) as n FROM letters;")?.n ?? 0;
      if (!has) {
        const stmt = db.prepareSync("INSERT INTO letters(id, ar, en, order_index) VALUES (?,?,?,?);");
        CANON_LETTERS.forEach((ar, i) => {
          stmt.executeSync([i, ar, null, i]);
        });
        stmt.finalizeSync();
      }
      const lvls = db.getFirstSync<{ n: number }>("SELECT COUNT(*) as n FROM levels;")?.n ?? 0;
      if (!lvls) {
        db.execSync(`
          INSERT INTO levels(level, min_accuracy, min_attempts) VALUES
            (1, 0.50, 20),
            (2, 0.65, 50),
            (3, 0.75, 100),
            (4, 0.85, 200),
            (5, 0.92, 350);
        `);
      }
    }
  },
];

export function runMigrations() {
    db.execSync("PRAGMA foreign_keys = ON;");
  
    db.execSync(`CREATE TABLE IF NOT EXISTS _meta (version INTEGER NOT NULL);`);
    const metaRow = db.getFirstSync<{ version: number }>(
      "SELECT version FROM _meta LIMIT 1;"
    );
    if (!metaRow) {
      db.execSync("INSERT INTO _meta(version) VALUES (0);");
    }
  
    let cur =
      db.getFirstSync<{ version: number }>(
        "SELECT version FROM _meta LIMIT 1;"
      )?.version ?? 0;
  
    for (const m of MIGRATIONS) {
      if (m.id > cur) {
        db.execSync("BEGIN;");
        try {
          db.execSync(m.sql);
          const stmt = db.prepareSync("UPDATE _meta SET version = ?;");
          stmt.executeSync([m.id]);
          stmt.finalizeSync();
          db.execSync("COMMIT;");
          m.post?.();
          cur = m.id;
        } catch (e) {
          db.execSync("ROLLBACK;");
          throw e;
        }
      }
    }
  }
  