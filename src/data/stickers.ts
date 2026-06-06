import type { Sticker } from "@/types";

/* The whole social vocabulary of the game — no chat, just stickers.
   Order is the order shown in the player's sticker tray. */
export const STICKERS: Sticker[] = [
  { id: "watch", emoji: "👀", label: "Watching" },
  { id: "lol", emoji: "😂", label: "LOL" },
  { id: "panic", emoji: "😱", label: "Panic" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "king", emoji: "👑", label: "King" },
  { id: "snake", emoji: "🐍", label: "Snake" },
  { id: "rip", emoji: "☠️", label: "RIP" },
  { id: "hmm", emoji: "🤔", label: "Hmm" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "luck", emoji: "🤞", label: "Good luck" },
];

/** Stickers bots like to throw while reacting (subset that reads as banter). */
export const BOT_STICKER_IDS = ["watch", "snake", "hmm", "lol", "fire", "panic", "luck"];

export const getSticker = (id: string): Sticker =>
  STICKERS.find((s) => s.id === id) ?? STICKERS[0];
