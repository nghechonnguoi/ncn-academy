import "../lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

async function main() {
  const db = getFirestore();
  const collections = await db.listCollections();
  console.log(`\nFirestore collections (${collections.length} total):`);
  collections.forEach((col) => console.log(" •", col.id));
  process.exit(0);
}
main().catch(console.error);
