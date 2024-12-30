const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.resetDailyQueue = functions.pubsub
  .schedule("0 0 * * *") // Runs every day at midnight UTC
  .timeZone("Etc/UTC")
  .onRun(async (context) => {
    const db = admin.firestore();
    const queueRef = db.collection("queue");
    const queueMetaRef = db.collection("queueMeta").doc("queueMeta");

    try {
      // Clear all patients in the queue
      const snapshot = await queueRef.get();
      const batch = db.batch();

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Reset the queue metadata
      batch.set(queueMetaRef, {
        queueNumber: "S5-01",
        lastResetDate: admin.firestore.Timestamp.now(),
      });

      await batch.commit();
      console.log("Daily queue reset completed successfully.");
    } catch (error) {
      console.error("Error resetting daily queue:", error);
    }
  });
