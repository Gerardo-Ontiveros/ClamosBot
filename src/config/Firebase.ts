import * as admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

const serviceAccount =
  require("../../serviceAccountKey.json") as ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://clamosbot-default-rtdb.firebaseio.com/",
  });
}

export const db = admin.database();
