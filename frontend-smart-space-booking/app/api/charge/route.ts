import { NextRequest, NextResponse } from "next/server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true";

const API_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reservationId,
      invoiceNumber,
      amount,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
    } = body;

    const method = (paymentMethod || "bca_va").toLowerCase();
    const cleanAmount = Math.round(Number(amount) || 50000);
    const orderId = `${invoiceNumber || `INV-${reservationId || Date.now()}`}-${method.toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const authHeader = `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")}`;

    const payload: Record<string, any> = {
      transaction_details: {
        order_id: orderId,
        gross_amount: cleanAmount,
      },
      customer_details: {
        first_name: customerName || "Member WorkNest",
        email: customerEmail || "member@worknest.id",
        phone: customerPhone || "081234567890",
      },
    };

    if (method.includes("bca")) {
      payload.payment_type = "bank_transfer";
      payload.bank_transfer = { bank: "bca" };
    } else if (method.includes("bni")) {
      payload.payment_type = "bank_transfer";
      payload.bank_transfer = { bank: "bni" };
    } else if (method.includes("bri")) {
      payload.payment_type = "bank_transfer";
      payload.bank_transfer = { bank: "bri" };
    } else if (method.includes("permata")) {
      payload.payment_type = "bank_transfer";
      payload.bank_transfer = { bank: "permata" };
    } else if (method.includes("mandiri") || method.includes("echannel")) {
      payload.payment_type = "echannel";
      payload.echannel = {
        bill_info1: "Sewa Ruangan",
        bill_info2: orderId,
      };
    } else if (method.includes("cstore") || method.includes("indomaret")) {
      payload.payment_type = "cstore";
      payload.cstore = { store: "indomaret", message: "WorkNest" };
    } else if (method.includes("alfamart")) {
      payload.payment_type = "cstore";
      payload.cstore = { store: "alfamart", message: "WorkNest" };
    } else if (method.includes("shopeepay")) {
      const origin = req.headers.get("origin") || req.nextUrl.origin || "https://booking.corecraft.my.id";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
      payload.payment_type = "shopeepay";
      payload.shopeepay = {
        callback_url: `${appUrl}/dashboard/member`,
      };
    } else if (method.includes("gopay")) {
      const origin = req.headers.get("origin") || req.nextUrl.origin || "https://booking.corecraft.my.id";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
      payload.payment_type = "gopay";
      payload.gopay = {
        enable_callback: true,
        callback_url: `${appUrl}/dashboard/member`,
      };
    } else {
      payload.payment_type = "qris";
      payload.qris = { acquirer: "gopay" };
    }

    const chargeRes = await fetch(`${API_BASE_URL}/v2/charge`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const resData = await chargeRes.json();

    let vaNumber: string | null = null;
    let bankName = "BANK";

    if (resData.va_numbers && resData.va_numbers[0]) {
      vaNumber = resData.va_numbers[0].va_number;
      bankName = (resData.va_numbers[0].bank || "").toUpperCase();
    } else if (resData.permata_va_number) {
      vaNumber = resData.permata_va_number;
      bankName = "PERMATA";
    } else if (resData.bill_key) {
      vaNumber = resData.bill_key;
      bankName = "MANDIRI";
    }

    const qrString = resData.qr_string || null;
    const qrImageUrl = qrString
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`
      : null;

    return NextResponse.json({
      success: true,
      statusCode: resData.status_code,
      statusMessage: resData.status_message,
      transactionId: resData.transaction_id || orderId,
      orderId,
      grossAmount: cleanAmount,
      paymentType: resData.payment_type || payload.payment_type,
      paymentMethod: method,
      bank: bankName,
      vaNumber,
      billerCode: resData.biller_code || (method.includes("mandiri") ? "70012" : null),
      billKey: resData.bill_key || null,
      paymentCode: resData.payment_code || null,
      qrString,
      qrImageUrl,
      raw: resData,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Gagal memproses pembayaran langsung ke Midtrans.",
      },
      { status: 500 }
    );
  }
}
