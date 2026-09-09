import { NextRequest, NextResponse } from "next/server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true";

const API_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-ukk.budayakita.com/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const reservationId = searchParams.get("reservationId");
    const transactionId = searchParams.get("transactionId");

    let isPaid = false;
    let transactionStatus = "pending";
    let statusCode = "201";

    const authHeader = `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")}`;
    const authBearer = req.headers.get("authorization");

    // 1. Check Midtrans status directly if orderId is available
    if (orderId) {
      try {
        const midtransRes = await fetch(`${API_BASE_URL}/v2/${orderId}/status`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: authHeader,
          },
          cache: "no-store",
        });

        if (midtransRes.ok) {
          const data = await midtransRes.json();
          transactionStatus = data.transaction_status || "pending";
          statusCode = data.status_code || "200";

          if (
            transactionStatus === "settlement" ||
            transactionStatus === "capture" ||
            data.status_code === "200"
          ) {
            isPaid = true;

            // Forward webhook notification payload to backend so the database updates immediately
            try {
              await fetch(`${BACKEND_API_BASE_URL}/transactions/notification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
            } catch {}
          }
        }
      } catch {}
    }

    // 2. Also query backend sync endpoint to ensure database is in sync
    const syncTargetId = transactionId || reservationId;
    if (syncTargetId) {
      try {
        const backendRes = await fetch(`${BACKEND_API_BASE_URL}/transactions/${syncTargetId}/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authBearer ? { Authorization: authBearer } : {}),
          },
        });

        if (backendRes.ok) {
          const syncData = await backendRes.json();
          const txStatus = syncData?.data?.statusPembayaran || syncData?.statusPembayaran;
          if (txStatus === "lunas") {
            isPaid = true;
            transactionStatus = "settlement";
          }
        }
      } catch {}
    }

    // 3. If still pending, check reservation status directly
    if (!isPaid && reservationId) {
      try {
        const resCheck = await fetch(`${BACKEND_API_BASE_URL}/reservations/${reservationId}`, {
          headers: {
            Accept: "application/json",
            ...(authBearer ? { Authorization: authBearer } : {}),
          },
          cache: "no-store",
        });
        if (resCheck.ok) {
          const resObj = await resCheck.json();
          if (
            resObj?.transaksi?.statusPembayaran === "lunas" ||
            resObj?.status === "disetujui" ||
            resObj?.status === "aktif"
          ) {
            isPaid = true;
            transactionStatus = "settlement";
          }
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      isPaid,
      transactionStatus: isPaid ? "settlement" : transactionStatus,
      statusCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
