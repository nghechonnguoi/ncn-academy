import "./lib/firebaseAdmin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { mapHollandCodeToBranch, DEFAULT_BRANCH } from "./lib/branch";
import { sendTemplateEmail } from "./lib/resend";
import { renderTemplate } from "./lib/template";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const WELCOME_STEP = 0;
const WELCOME_DELAY_DAYS = 1;

/**
 * Fires when a new document is created in `leads/{leadId}`.
 * Sends the branch's step-0 (welcome) email via Resend and schedules the
 * next nurture send for `dailyNurtureSend` to pick up.
 */
export const onLeadCreated = onDocumentCreated(
  {
    document: "leads/{leadId}",
    region: "asia-southeast1",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const lead = snap.data();
    const email: string | undefined = lead?.email;
    const leadId = event.params.leadId;

    if (!email) {
      logger.warn(`Lead ${leadId} has no email, skipping welcome email.`);
      return;
    }

    const branch = mapHollandCodeToBranch(lead?.quizResult?.hollandCode);
    const db = getFirestore();

    let templateSnap = await db.collection("email_templates").doc(`${branch}_${WELCOME_STEP}`).get();
    if (!templateSnap.exists && branch !== DEFAULT_BRANCH) {
      templateSnap = await db.collection("email_templates").doc(`${DEFAULT_BRANCH}_${WELCOME_STEP}`).get();
    }

    if (!templateSnap.exists) {
      logger.error(`No email_templates doc found for branch="${branch}" step=${WELCOME_STEP} (lead ${leadId}).`);
      return;
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
      logger.error(`Failed to send welcome email to ${email} (lead ${leadId}):`, err);
      return;
    }

    const now = Timestamp.now();
    const delayDays = Number(template.delayDays ?? WELCOME_DELAY_DAYS) || WELCOME_DELAY_DAYS;
    const nextSendAt = Timestamp.fromMillis(now.toMillis() + delayDays * 24 * 60 * 60 * 1000);

    await snap.ref.update({
      "emailSequence.branch": branch,
      "emailSequence.currentStep": WELCOME_STEP + 1,
      "emailSequence.lastSentAt": now,
      "emailSequence.nextSendAt": nextSendAt,
      "emailSequence.unsubscribed": lead?.emailSequence?.unsubscribed ?? false,
    });

    logger.info(`Sent welcome email (branch=${branch}) to ${email} for lead ${leadId}.`);
  }
);
