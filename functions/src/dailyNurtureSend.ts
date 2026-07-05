import "./lib/firebaseAdmin";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { DEFAULT_BRANCH } from "./lib/branch";
import { sendTemplateEmail } from "./lib/resend";
import { renderTemplate } from "./lib/template";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
// Shared secret Cloud Scheduler must send as the `x-cron-secret` header, so this
// public HTTPS endpoint can't be used by anyone else to blast emails on demand.
const CRON_SECRET = defineSecret("CRON_SECRET");

const DEFAULT_STEP_DELAY_DAYS = 1;

/**
 * HTTP-triggered function meant to be called once a day by a Cloud Scheduler
 * job set to `0 9 * * *` with timeZone `Asia/Ho_Chi_Minh` (9:00 AM Vietnam time).
 *
 * Setup (one-time, after `firebase deploy --only functions`):
 *   gcloud scheduler jobs create http daily-nurture-send \
 *     --schedule="0 9 * * *" \
 *     --time-zone="Asia/Ho_Chi_Minh" \
 *     --uri="<deployed dailyNurtureSend URL>" \
 *     --http-method=POST \
 *     --headers="x-cron-secret=<value of CRON_SECRET secret>"
 */
export const dailyNurtureSend = onRequest(
  {
    region: "us-central1",
    secrets: [RESEND_API_KEY, CRON_SECRET],
    timeoutSeconds: 300,
  },
  async (req, res) => {
    if (req.get("x-cron-secret") !== CRON_SECRET.value()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const db = getFirestore();
    const now = Timestamp.now();

    const snapshot = await db
      .collection("leads")
      .where("emailSequence.nextSendAt", "<=", now)
      .where("emailSequence.unsubscribed", "==", false)
      .where("purchases.coursePurchased", "==", false)
      .get();

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const lead = doc.data();
      const email: string | undefined = lead?.email;
      const branch: string = lead?.emailSequence?.branch || DEFAULT_BRANCH;
      const currentStep: number = lead?.emailSequence?.currentStep ?? 0;

      if (!email) {
        skipped++;
        continue;
      }

      let templateSnap = await db.collection("email_templates").doc(`${branch}_${currentStep}`).get();
      if (!templateSnap.exists && branch !== DEFAULT_BRANCH) {
        templateSnap = await db.collection("email_templates").doc(`${DEFAULT_BRANCH}_${currentStep}`).get();
      }

      if (!templateSnap.exists) {
        // No more steps configured for this branch — end the sequence so this
        // lead stops matching the `nextSendAt <= now` query every day.
        logger.info(`No template for branch="${branch}" step=${currentStep}, ending sequence for lead ${doc.id}.`);
        await doc.ref.update({ "emailSequence.nextSendAt": null });
        skipped++;
        continue;
      }

      const template = templateSnap.data() as {
        subject?: string;
        bodyHtml?: string;
        delayDays?: number;
      };
      const vars = { name: lead?.name || "", email };

      try {
        await sendTemplateEmail({
          apiKey: RESEND_API_KEY.value(),
          to: email,
          subject: renderTemplate(template.subject || "", vars),
          html: renderTemplate(template.bodyHtml || "", vars),
        });
      } catch (err) {
        logger.error(`Failed to send nurture email to ${email} (lead ${doc.id}):`, err);
        failed++;
        continue;
      }

      const delayDays = Number(template.delayDays ?? DEFAULT_STEP_DELAY_DAYS) || DEFAULT_STEP_DELAY_DAYS;
      const nextSendAt = Timestamp.fromMillis(now.toMillis() + delayDays * 24 * 60 * 60 * 1000);

      await doc.ref.update({
        "emailSequence.currentStep": currentStep + 1,
        "emailSequence.lastSentAt": now,
        "emailSequence.nextSendAt": nextSendAt,
      });

      sent++;
    }

    logger.info(`dailyNurtureSend done: sent=${sent} skipped=${skipped} failed=${failed} total=${snapshot.size}`);
    res.status(200).json({ sent, skipped, failed, total: snapshot.size });
  }
);
