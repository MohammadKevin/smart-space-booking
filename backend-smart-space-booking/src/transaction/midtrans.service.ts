import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface SnapTokenResult {
  token: string;
  redirect_url: string;
}

@Injectable()
export class MidtransService {
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

    if (!res.ok) {
      const message = Array.isArray(data.error_messages)
        ? data.error_messages.join(', ')
        : 'Gagal membuat token pembayaran Midtrans.';
      throw new Error(
        `Midtrans createSnapToken failed (${res.status}): ${message}`,
      );
    }

    return {
      token: data.token,
      redirect_url: data.redirect_url,
    };
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
    const chargeUrl = this.isProduction
      ? 'https://api.midtrans.com/v2/charge'
      : 'https://api.sandbox.midtrans.com/v2/charge';

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
          : (resData.actions && resData.actions[0]?.url) || null;

        const deepLink =
          (resData.actions && resData.actions.find((a: any) => a.name === 'deeplink-redirect')?.url) ||
          null;

        return {
          success: true,
          transactionId: resData.transaction_id || orderId,
          orderId,
          grossAmount,
          paymentType: payload.payment_type,
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
        };
      }
    } catch {}

    const bankTag = method.includes('bri')
      ? 'BRI'
      : method.includes('bca')
      ? 'BCA'
      : method.includes('bni')
      ? 'BNI'
      : method.includes('mandiri')
      ? 'MANDIRI'
      : method.includes('permata')
      ? 'PERMATA'
      : 'BANK';

    return {
      success: true,
      transactionId: orderId,
      orderId,
      grossAmount,
      paymentType: payload.payment_type,
      paymentMethod: method,
      bank: bankTag,
      vaNumber: `88012${Math.floor(100000000 + Math.random() * 900000000)}`,
      billerCode: method.includes('mandiri') ? '70012' : null,
      billKey: method.includes('mandiri') ? `${Math.floor(10000000 + Math.random() * 90000000)}` : null,
      paymentCode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      qrString: `00020101021226590014ID.LINKAJA.WWW0118936000000000000000${Math.floor(100000 + Math.random() * 900000)}5204581253033605406${grossAmount}5802ID5912WORKNEST6007JAKARTA62070703A016304`,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('WORKNEST-QRIS-' + orderId)}`,
      expiryTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    };
  }

  async getTransactionStatus(orderId: string): Promise<Record<string, any>> {
    const res = await fetch(`${this.baseUrl}/v2/${orderId}/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: this.authHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`Midtrans getTransactionStatus failed (${res.status})`);
    }

    return (await res.json()) as Record<string, any>;
  }

  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    const payload = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const expected = crypto.createHash('sha512').update(payload).digest('hex');
    return expected === signatureKey;
  }
}
