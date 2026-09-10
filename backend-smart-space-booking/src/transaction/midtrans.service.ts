import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface SnapTokenResult {
  token: string;
  redirect_url: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly isProduction: boolean;
  private readonly serverKey: string;

  constructor(private readonly config: ConfigService) {
    this.isProduction = config.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    this.serverKey = config.get<string>('MIDTRANS_SERVER_KEY') ?? '';
  }

  get clientKey(): string {
    return this.config.get<string>('MIDTRANS_CLIENT_KEY') ?? '';
  }

  get merchantId(): string {
    return this.config.get<string>('MIDTRANS_MERCHANT_ID') ?? '';
  }

  private get baseUrl(): string {
    return this.isProduction
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';
  }

  private get apiBaseUrl(): string {
    return this.isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
  }

  get snapScriptUrl(): string {
    return `${this.baseUrl}/snap/snap.js`;
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`;
  }

  private isValidEmail(value?: string): boolean {
    return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async createSnapToken(params: {
    orderId: string;
    grossAmount: number;
    firstName?: string;
    email?: string;
    phone?: string;
    itemDetails?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
      merchant_name?: string;
    }>;
    customField1?: string;
    customField2?: string;
    customField3?: string;
  }): Promise<SnapTokenResult> {
    const {
      orderId,
      grossAmount,
      firstName,
      email,
      phone,
      itemDetails,
      customField1,
      customField2,
      customField3,
    } = params;

    const customerDetails: Record<string, string> = {
      first_name: firstName || 'Member',
      phone: phone || '',
    };
    if (this.isValidEmail(email)) {
      customerDetails.email = email as string;
    }

    const body: Record<string, unknown> = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      credit_card: {
        secure: true,
      },
      customer_details: customerDetails,
      ...(itemDetails && itemDetails.length > 0 ? { item_details: itemDetails } : {}),
      ...(customField1 ? { custom_field1: customField1 } : {}),
      ...(customField2 ? { custom_field2: customField2 } : {}),
      ...(customField3 ? { custom_field3: customField3 } : {}),
      enabled_payments: [
        'credit_card',
        'bca_va',
        'bni_va',
        'bri_va',
        'permata_va',
        'cimb_va',
        'other_va',
        'echannel',
        'mandiri_clickpay',
        'cimb_clicks',
        'bca_klikbca',
        'bca_klikpay',
        'bri_epay',
        'gopay',
        'shopeepay',
        'qris',
        'indomaret',
        'alfamart',
        'akulaku',
        'kredivo',
        'danamon_online',
      ],
    };

    if (!this.serverKey) {
      return {
        token: `SNAP-MOCK-${orderId}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/MOCK-${orderId}`,
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/snap/v1/transactions`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: this.authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as Record<string, any>;

      if (!res.ok || !data.token) {
        return {
          token: `SNAP-DEV-${orderId}`,
          redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderId}`,
        };
      }

      return {
        token: data.token,
        redirect_url: data.redirect_url || `https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.token}`,
      };
    } catch {
      return {
        token: `SNAP-OFFLINE-${orderId}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderId}`,
      };
    }
  }

  async chargeDirectPayment(params: {
    orderId: string;
    grossAmount: number;
    paymentMethod: string;
    firstName?: string;
    email?: string;
    phone?: string;
    itemDetails?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
      merchant_name?: string;
    }>;
    customField1?: string;
    customField2?: string;
    customField3?: string;
  }): Promise<Record<string, any>> {
    const {
      orderId,
      grossAmount,
      paymentMethod,
      firstName,
      email,
      phone,
      itemDetails,
      customField1,
      customField2,
      customField3,
    } = params;

    const customerDetails: Record<string, string> = {
      first_name: firstName || 'Member',
      phone: phone || '',
    };
    if (this.isValidEmail(email)) {
      customerDetails.email = email as string;
    }

    const method = (paymentMethod || 'qris').toLowerCase();
    const chargeUrl = `${this.apiBaseUrl}/v2/charge`;

    const payload: Record<string, any> = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      customer_details: customerDetails,
      ...(itemDetails && itemDetails.length > 0 ? { item_details: itemDetails } : {}),
      ...(customField1 ? { custom_field1: customField1 } : {}),
      ...(customField2 ? { custom_field2: customField2 } : {}),
      ...(customField3 ? { custom_field3: customField3 } : {}),
    };

    if (method.includes('bri')) {
      payload.payment_type = 'bank_transfer';
      payload.bank_transfer = { bank: 'bri' };
    } else if (method.includes('bca')) {
      payload.payment_type = 'bank_transfer';
      payload.bank_transfer = { bank: 'bca' };
    } else if (method.includes('bni')) {
      payload.payment_type = 'bank_transfer';
      payload.bank_transfer = { bank: 'bni' };
    } else if (method.includes('permata') || method.includes('cimb')) {
      payload.payment_type = 'bank_transfer';
      payload.bank_transfer = { bank: 'permata' };
    } else if (method.includes('mandiri') || method.includes('echannel')) {
      payload.payment_type = 'echannel';
      payload.echannel = {
        bill_info1: 'Pembayaran:',
        bill_info2: orderId,
      };
    } else if (method.includes('indomaret')) {
      payload.payment_type = 'cstore';
      payload.cstore = { store: 'indomaret', message: 'WorkNest' };
    } else if (method.includes('alfamart')) {
      payload.payment_type = 'cstore';
      payload.cstore = { store: 'alfamart', message: 'WorkNest' };
    } else if (method.includes('shopeepay')) {
      payload.payment_type = 'shopeepay';
      payload.shopeepay = {
        callback_url: 'https://booking.corecraft.my.id/dashboard/member',
      };
    } else if (method.includes('gopay')) {
      payload.payment_type = 'gopay';
      payload.gopay = {
        enable_callback: true,
        callback_url: 'https://booking.corecraft.my.id/dashboard/member',
      };
    } else {
      payload.payment_type = 'qris';
      payload.qris = { acquirer: 'gopay' };
    }

    try {
      const res = await fetch(chargeUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: this.authHeader(),
        },
        body: JSON.stringify(payload),
      });

      const resData = (await res.json()) as Record<string, any>;

      if (res.ok && Number(resData.status_code || '400') < 300) {
        return this.formatDirectPaymentResponse(resData, orderId, grossAmount, method, payload.payment_type);
      }

      // If duplicate order ID (406), fetch the existing transaction status from Midtrans
      if (resData.status_code === '406' || res.status === 406) {
        try {
          const statusData = await this.getTransactionStatus(orderId);
          if (statusData && Number(statusData.status_code || '400') < 300) {
            return this.formatDirectPaymentResponse(statusData, orderId, grossAmount, method, payload.payment_type);
          }
        } catch {}
      }

      throw new Error(resData.status_message || 'Gagal memproses charge payment gateway Midtrans.');
    } catch (err: any) {
      throw err;
    }
  }

  private formatDirectPaymentResponse(
    resData: Record<string, any>,
    orderId: string,
    grossAmount: number,
    method: string,
    fallbackPaymentType: string,
  ): Record<string, any> {
    let vaNumber: string | null = null;
    let bankName = 'BANK';

    if (resData.va_numbers && resData.va_numbers[0]) {
      vaNumber = resData.va_numbers[0].va_number;
      bankName = (resData.va_numbers[0].bank || '').toUpperCase();
    } else if (resData.permata_va_number) {
      vaNumber = resData.permata_va_number;
      bankName = 'PERMATA';
    } else if (resData.bill_key) {
      vaNumber = resData.bill_key;
      bankName = 'MANDIRI';
    }

    const qrString = resData.qr_string || null;
    const qrImageUrl = qrString
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`
      : (resData.actions && resData.actions.find((a: any) => a.name === 'generate-qr-code')?.url) ||
        (resData.actions && resData.actions[0]?.url) ||
        null;

    const deepLink =
      (resData.actions && resData.actions.find((a: any) => a.name === 'deeplink-redirect')?.url) ||
      null;

    return {
      success: true,
      transactionId: resData.transaction_id || orderId,
      orderId,
      grossAmount,
      paymentType: resData.payment_type || fallbackPaymentType,
      paymentMethod: method,
      bank: bankName,
      vaNumber,
      billerCode: resData.biller_code || null,
      billKey: resData.bill_key || null,
      paymentCode: resData.payment_code || null,
      qrString,
      qrImageUrl,
      deepLink,
      expiryTime: resData.expiry_time || new Date(Date.now() + 24 * 3600000).toISOString(),
      statusMessage: resData.status_message,
      transactionStatus: resData.transaction_status,
    };
  }

  async getTransactionStatus(orderId: string): Promise<Record<string, any>> {
    if (!this.serverKey) {
      this.logger.warn(
        `[SECURITY] MIDTRANS_SERVER_KEY belum dikonfigurasi. Tidak dapat memverifikasi status order '${orderId}'.`,
      );
      return {
        status_code: '500',
        transaction_status: 'unconfigured',
        payment_type: 'unknown',
      };
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/v2/${orderId}/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: this.authHeader(),
        },
      });

      if (!res.ok) {
        return {
          status_code: String(res.status),
          transaction_status: 'pending',
          payment_type: 'midtrans',
        };
      }

      return (await res.json()) as Record<string, any>;
    } catch (err: any) {
      this.logger.error(`Error querying Midtrans status: ${err?.message}`);
      return {
        status_code: '500',
        transaction_status: 'pending',
        payment_type: 'midtrans',
      };
    }
  }

  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    if (!this.serverKey) {
      this.logger.error(
        '[SECURITY] MIDTRANS_SERVER_KEY kosong. Verifikasi signature notifikasi webhook ditolak.',
      );
      return false;
    }
    const payload = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const expected = crypto.createHash('sha512').update(payload).digest('hex');
    return expected === signatureKey;
  }
}
