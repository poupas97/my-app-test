import Image from "next/image";
import styles from "./Avatar.module.css";

type AvatarProps = {
  name: string;
  src: string | null;
  alt?: string;
  size?: number;
};

// Shows the image when there is one, otherwise the name's initial. The
// initial is decorative because the name is always shown alongside it.
export default function Avatar({ name, src, alt, size = 96 }: AvatarProps) {
  if (src) {
    return (
      <Image
        className={styles.avatar}
        src={src}
        alt={alt ?? `${name}'s avatar`}
        width={size}
        height={size}
        unoptimized
      />
    );
  }

  return (
    <div className={styles.placeholder} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
