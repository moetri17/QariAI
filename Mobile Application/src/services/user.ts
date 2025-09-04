/**
 * User Service — Local User Management
 * Ensures each installation has a unique local user id.
 * - Stores the id in AsyncStorage under "qariai:user_id".
 * - If no id exists, generates one with nanoid, inserts it into the `users` table,
 *   and saves it to AsyncStorage with display_name = "Local User".
 * Usage: call ensureLocalUser() at startup or before recording attempts;
 * it returns the stable user id string.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import { db } from "../db/schema";

const KEY = "qariai:user_id";

export async function ensureLocalUser(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;

  const id = nanoid();
  db.prepareSync("INSERT INTO users(id, display_name) VALUES(?, ?);").executeSync([id, "Local User"]);
  await AsyncStorage.setItem(KEY, id);
  return id;
}
