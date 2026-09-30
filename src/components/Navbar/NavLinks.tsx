"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./Navbar.module.css";

export type NavLink = {
  href: string;
  label: string;
};

type NavLinksProps = {
  links: NavLink[];
};

// Nested routes (e.g. /f1/f11) keep their parent link active; "/" only
// matches itself so Home isn't highlighted everywhere.
export const isActivePath = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.toggleIcon} aria-hidden />
        <span className={styles.toggleLabel}>Menu</span>
      </button>

      <ul id={listId} className={styles.list} data-open={open}>
        {links.map(({ href, label }) => {
          const active = isActivePath(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={styles.link}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
