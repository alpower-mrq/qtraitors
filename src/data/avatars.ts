/* ============================================================
   The 20 player avatars.
   Art lives in /public/avatars/1.webp … 20.webp (oval character
   badges with transparent corners). Masters are PNGs in /assets;
   run `npm run compress:assets` to (re)generate the WebP set.
   ============================================================ */

export interface AvatarDef {
  id: number;
  /** URL served from /public. */
  src: string;
}

export const AVATAR_COUNT = 32;

/** Native art aspect ratio (width 176 : height 221). */
export const AVATAR_AR = 221 / 176;

export const AVATARS: AvatarDef[] = Array.from({ length: AVATAR_COUNT }, (_, id) => ({
  id,
  src: `/avatars/${id + 1}.webp`,
}));

export const getAvatar = (id: number): AvatarDef =>
  AVATARS[((id % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT];

export const avatarSrc = (id: number): string => getAvatar(id).src;
