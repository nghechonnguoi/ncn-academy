import "./lib/firebaseAdmin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { DEFAULT_BRANCH } from "./lib/branch";
import { sendTemplateEmail } from "./lib/resend";
import { renderTemplate } from "./lib/template";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const WELCOME_STEP = 0;
const WELCOME_DELAY_DAYS = 1;

/**
 * Fires when a new document is created in `customers/{customerId}`.
 * Sends the welcome email via Resend and schedules nurture sequence.
 */
export const onCustomerCreated = onDocumentCreated(
  {
    document: "customers/{customerId}",
    region: "asia-southeast1",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const customer = snap.data();
    const email: string | undefined = customer?.email;
    const customerId = event.params.customerId;

    if (!email) {
      logger.warn(`Customer ${customerId} has no email, skipping welcome email.`);
      return;
    }

    const branch = DEFAULT_BRANCH;
    const db = getFirestore();

    const templateSnap = await db.collection("email_templates").doc(`${branch}_${WELCOME_STEP}`).get();

    if (!templateSnap.exists) {
      logger.error(`No email_templates doc found for branch="${branch}" step=${WELCOME_STEP} (customer ${customerId}).`);
      return;
    }

    const template = templateSnap.data() as {
      subject?: string;
      bodyHtml?: string;
      delayDays?: number;
    };
    const vars = { name: customer?.fullName || "", email };

    try {
      await sendTemplateEmail({
        apiKey: RESEND_API_KEY.value(),
        to: email,
        subject: renderTemplate(template.subject || "", vars),
        html: renderTemplate(template.bodyHtml || "", vars),
      });
    } catch (err) {
      logger.error(`Failed to send welcome email to ${email} (customer ${customerId}):`, err);
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
      "emailSequence.unsubscribed": customer?.emailSequence?.unsubscribed ?? false,
      "emailSequence.sequenceType": "nurture",
    });

    logger.info(`Sent welcome email (branch=${branch}) to ${email} for customer ${customerId}.`);
  }
);
