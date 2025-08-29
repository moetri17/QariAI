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
