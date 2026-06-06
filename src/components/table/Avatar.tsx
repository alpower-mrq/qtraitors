import { AVATAR_AR, avatarSrc } from "@/data/avatars";

interface AvatarProps {
  /** `size` is the avatar WIDTH in px; height follows the art aspect. */
  avatarId: number;
  size?: number;
  /** dead = eliminated bot (greyed), ghost = spectating human */
  variant?: "alive" | "dead" | "ghost";
  className?: string;
}

/**
 * A player avatar — an oval character badge with transparent corners.
 * This is the ONLY place that knows how an avatar is drawn: it renders
 * an <img> from /public/avatars. Swap the art there (same filenames)
 * and nothing else in the app needs to change.
 */
export function Avatar({ avatarId, size = 60, variant = "alive", className = "" }: AvatarProps) {
  const variantClass = variant === "dead" ? "dead" : variant === "ghost" ? "ghost" : "";
  return (
    <div
      className={`qt-avatar ${variantClass} ${className}`}
      style={{ width: size, height: Math.round(size * AVATAR_AR) }}
    >
      <img className="qt-avatar-img" src={avatarSrc(avatarId)} alt="" draggable={false} />
    </div>
  );
}
