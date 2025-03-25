const { onRequest } = require("firebase-functions/v2/https");
const { getStorage } = require("firebase-admin/storage");
const cors = require("cors")({ origin: true });

const signedPdf = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const bucket = getStorage().bucket();
      const filePath = decodeURIComponent(req.query.file); // Expecting a file path (e.g., "2025JFK/104-10071-10102.pdf")
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "File not found." });
      }

      // Generate a signed URL valid for 1 hour (3600 seconds)
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000, // 1 hour expiry
      });

      res.status(200).json({ pdfUrl: url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

module.exports =  signedPdf ;
