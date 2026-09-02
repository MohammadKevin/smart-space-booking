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
  }): Promise<SnapTokenResult> {
    const { orderId, grossAmount, firstName, email, phone } = params;

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
