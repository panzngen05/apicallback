import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    // ✅ BYPASS VALIDATION TEST
    if (data.isValidationTest) {
      console.log("🧪 VALIDATION TEST OK");
      return res.status(200).json({ status: "ok" });
    }

    const merchantCode = req.headers["x-merchant-code"];
    const signature = req.headers["x-signature"];

    const rawBody = JSON.stringify(data);

    // VALIDASI MERCHANT
    if (merchantCode !== process.env.MERCHANT_CODE) {
      return res.status(401).json({ message: "Invalid merchant" });
    }

    // VALIDASI SIGNATURE
    const expectedSignature = crypto
      .createHmac("sha256", process.env.API_KEY)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    console.log("📩 CALLBACK MASUK:", data);

    // HANDLE PAYMENT SUCCESS
    if (
      data.payment_status === "PAID" ||
      data.status === "success"
    ) {
      console.log("✅ PAYMENT SUCCESS:", data.partnerReferenceNo);
    }

    return res.status(200).json({ status: "ok" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
