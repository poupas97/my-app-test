import styles from "../../page.module.css";
import { makeApiRequest } from "@/request";
import Footer from "@/components/Footer/Footer";
import Link from "next/link";

export default async function Home() {
  await makeApiRequest(`/equipments?limit=${10}&page=${1}`);

  return (
    <div className={styles.page}>
      <Link href="/f1/f11">
        <h1>F11</h1>
      </Link>
      <Footer />
    </div>
  );
}
