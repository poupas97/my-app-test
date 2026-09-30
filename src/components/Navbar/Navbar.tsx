import Link from "next/link";
import NavLinks, { type NavLink } from "./NavLinks";
import styles from "./Navbar.module.css";

const links: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/f1", label: "F1" },
  { href: "/f2", label: "F2" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          My App
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <NavLinks links={links} />
        </nav>
      </div>
    </header>
  );
}
