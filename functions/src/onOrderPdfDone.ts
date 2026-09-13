import "./lib/firebaseAdmin";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Fires when an order document is updated in `orders/{orderId}`.
 * When `pdfDone` flips to `true`, finds the corresponding customer
 * by email and stops their email sequence.
 */
export const onOrderPdfDone = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Chỉ xử lý khi pdfDone vừa chuyển sang true
    if (before?.pdfDone === true || after?.pdfDone !== true) {
      return;
    }

    const orderId = event.params.orderId;
    logger.info(`onOrderPdfDone: order ${orderId} pdfDone=true → tắt email sequence.`);

    // Lấy email từ order (thử nhiều field)
    const email: string | undefined =
      after?.email?.trim() ||
      after?.payload?.email?.trim() ||
      after?.customerEmail?.trim();

    if (!email) {
      logger.warn(`onOrderPdfDone: order ${orderId} không có email, bỏ qua.`);
      return;
    }

    const db = getFirestore();

    // Tìm customers theo email
    const custSnap = await db
      .collection("customers")
      .where("email", "==", email)
      .get();

    if (custSnap.empty) {
      logger.info(`onOrderPdfDone: không tìm thấy customer với email ${email}.`);
      return;
    }

    // Tắt sequence cho tất cả customer có email này
    const batch = db.batch();
    for (const doc of custSnap.docs) {
      const data = doc.data();
      // Chỉ tắt nếu đang trong sequence (tránh ghi đè người đã completed/unsubscribed)
      if (
        data?.emailSequence?.sequenceType === "completed" ||
        data?.emailSequence?.unsubscribed === true
      ) {
        continue;
      }
      batch.update(doc.ref, {
        "emailSequence.nextSendAt": null,
        "emailSequence.sequenceType": "completed",
      });
      logger.info(
        `onOrderPdfDone: tắt sequence cho customer ${doc.id} (${email}) — order ${orderId}.`
      );
    }
    await batch.commit();
  }
);
