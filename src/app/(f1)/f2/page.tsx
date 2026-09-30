import styles from "../../page.module.css";
import { makeApiRequest } from "@/request";
import Footer, { FOOTER_LINKS } from "@/components/Footer/Footer";

export default async function Home() {
  await makeApiRequest(`/equipments?limit=${10}&page=${1}`);

  return (
    <div className={styles.page}>
      <Footer links={FOOTER_LINKS.filter((link) => link.id !== "learn")} />
    </div>
  );
}
