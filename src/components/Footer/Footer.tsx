import Image from "next/image";
import styles from "./Footer.module.css";

export type FooterLink = {
  id: string;
  href: string;
  label: string;
  icon: string;
  iconAlt: string;
};

const UTM = "utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app";

export const FOOTER_LINKS: FooterLink[] = [
  {
    id: "learn",
    href: `https://nextjs.org/learn?${UTM}`,
    label: "Learn",
    icon: "https://nextjs.org/icons/file.svg",
    iconAlt: "File icon",
  },
  {
    id: "examples",
    href: `https://vercel.com/templates?framework=next.js&${UTM}`,
    label: "Examples",
    icon: "https://nextjs.org/icons/window.svg",
    iconAlt: "Window icon",
  },
  {
    id: "nextjs",
    href: `https://nextjs.org?${UTM}`,
    label: "Go to nextjs.org →",
    icon: "https://nextjs.org/icons/globe.svg",
    iconAlt: "Globe icon",
  },
];

type FooterProps = {
  links?: FooterLink[];
};

export default function Footer({ links = FOOTER_LINKS }: FooterProps) {
  return (
    <footer className={styles.footer}>
      {links.map(({ id, href, label, icon, iconAlt }) => (
        <a key={id} href={href} target="_blank" rel="noopener noreferrer">
          <Image aria-hidden src={icon} alt={iconAlt} width={16} height={16} />
          {label}
        </a>
      ))}
    </footer>
  );
}
