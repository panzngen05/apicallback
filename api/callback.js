import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    // 🧪 HANDLE VALIDATION TEST (SANPAY)
    if (data.isValidationTest) {
      console.log("🧪 Validation test from Sanpay");
      return res.status(200).json({ status: "ok" });
    }

    const merchantCode = req.headers["x-merchant-code"];
    const signature = req.headers["x-signature"];

    const rawBody = JSON.stringify(data);

    // 🔐 VALIDASI MERCHANT
    if (merchantCode !== process.env.MERCHANT_CODE) {
      console.log("❌ Invalid merchant");
      return res.status(401).json({ message: "Invalid merchant" });
    }

    // 🔐 VALIDASI SIGNATURE
    const expectedSignature = crypto
      .createHmac("sha256", process.env.API_KEY)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.log("❌ Invalid signature");
      return res.status(401).json({ message: "Invalid signature" });
    }

    console.log("📩 Callback masuk:", data);

    // ✅ HANDLE PAYMENT SUCCESS
    if (
      data.payment_status === "PAID" ||
      data.status === "success"
    ) {
      const amount = data.amount;
      const ref = data.partnerReferenceNo || "-";

      console.log("✅ Payment success:", ref);

      // 📲 KIRIM KE TELEGRAM
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: process.env.CHAT_ID,
          text: `💰 *Payment Masuk!*\n\n💵 Nominal: Rp ${amount}\n🧾 Ref: ${ref}`,
          parse_mode: "Markdown"
        })
      });
    }

    return res.status(200).json({ status: "ok" });

  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
