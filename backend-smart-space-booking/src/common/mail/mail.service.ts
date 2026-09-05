import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        this.logger.log(`SMTP Mail Transporter ready (${host}:${port})`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${err.message}`);
      }
    } else {
      this.logger.log(
        'SMTP configuration not set in .env. Falling back to console/simulated mailer.',
      );
    }
  }

  async sendVerificationOtp(email: string, name: string, otp: string) {
    const from = process.env.SMTP_FROM || '"WorkNest Coworking" <no-reply@worknest.app>';
    const subject = `[WorkNest] Kode Verifikasi Email Anda: ${otp}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background-color: #0891b2; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">WorkNest</h1>
          <p style="color: #cffafe; margin: 4px 0 0 0; font-size: 12px;">Smart Coworking & Space Booking</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a;">Halo, ${name || 'Pengguna'}!</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #475569;">
            Terima kasih telah mendaftar di <strong>WorkNest</strong>. Gunakan 6-digit kode OTP di bawah ini untuk memverifikasi alamat email akun Anda:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #15803d;">${otp}</span>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Kode berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapapun.</p>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #64748b;">
            Jika Anda tidak merasa mendaftar di WorkNest, Anda dapat mengabaikan email ini dengan aman.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} WorkNest Coworking System. All rights reserved.
        </div>
      </div>
    `;

    this.logger.log(`\n======================================================\n📨 [VERIFIKASI EMAIL OTP]\nKepada : ${email} (${name})\nKode OTP : ${otp}\nBerlaku  : 15 Menit\n======================================================\n`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          html,
        });
      } catch (err: any) {
        this.logger.error(`Failed to send email via SMTP: ${err.message}`);
      }
    }
  }

  async sendResetPasswordOtp(email: string, name: string, otp: string) {
    const from = process.env.SMTP_FROM || '"WorkNest Security" <security@worknest.app>';
    const subject = `[WorkNest] Kode Reset Kata Sandi Anda: ${otp}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">WorkNest</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Keamanan Akun & Pemulihan Password</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a;">Permintaan Reset Kata Sandi</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #475569;">
            Kami menerima permintaan untuk mereset kata sandi akun WorkNest Anda (<strong>${email}</strong>). Gunakan kode OTP di bawah ini untuk membuat kata sandi baru:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Kode berlaku selama <strong>15 menit</strong>. Jangan berikan kode ini kepada pihak manapun.</p>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #64748b;">
            Jika Anda tidak meminta reset kata sandi, akun Anda tetap aman dan Anda dapat mengabaikan email ini.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} WorkNest Security Center.
        </div>
      </div>
    `;

    this.logger.log(`\n======================================================\n🔑 [RESET PASSWORD OTP]\nKepada : ${email} (${name})\nKode OTP : ${otp}\nBerlaku  : 15 Menit\n======================================================\n`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          html,
        });
      } catch (err: any) {
        this.logger.error(`Failed to send reset email via SMTP: ${err.message}`);
      }
    }
  }

  async sendBookingApprovedEmail(
    email: string,
    memberName: string,
    spaceName: string,
    date: string,
    time: string,
    qrCode: string,
    invoiceNumber: string,
    total: number,
  ) {
    const from = process.env.SMTP_FROM || '"WorkNest Booking" <booking@worknest.app>';
    const subject = `[WorkNest] Reservasi #${qrCode} Disetujui! - ${spaceName}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background-color: #0891b2; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">WorkNest</h1>
          <p style="color: #cffafe; margin: 4px 0 0 0; font-size: 12px;">Pemesanan Anda Telah Dikonfirmasi</p>
        </div>
        <div style="padding: 28px;">
          <h2 style="font-size: 16px; font-weight: 700; margin-top: 0; color: #0f172a;">Halo ${memberName},</h2>
          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Reservasi Anda untuk <strong>${spaceName}</strong> telah <strong>disetujui</strong> oleh pengelola coworking space.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 12px; line-height: 1.8;">
            <div><strong>Nomor Invoice:</strong> ${invoiceNumber}</div>
            <div><strong>Jadwal:</strong> ${date}, Pukul ${time} WIB</div>
            <div><strong>Kode Tiket QR:</strong> <span style="font-family: monospace; font-weight: 700; color: #0891b2;">${qrCode}</span></div>
            <div><strong>Total Biaya:</strong> Rp ${total.toLocaleString('id-ID')}</div>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Tunjukkan kode tiket QR saat tiba di lokasi untuk proses check-in cepat oleh staff resepsionis.
          </p>
        </div>
      </div>
    `;

    this.logger.log(`[EMAIL NOTIFICATION] Booking approved for ${email}: ${spaceName} (${qrCode})`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to: email, subject, html });
      } catch (err: any) {
        this.logger.error(`SMTP notification error: ${err.message}`);
      }
    }
  }

  async sendPaymentSuccessEmail(
    email: string,
    memberName: string,
    spaceName: string,
    invoiceNumber: string,
    total: number,
    method: string,
  ) {
    const from = process.env.SMTP_FROM || '"WorkNest Payments" <billing@worknest.app>';
    const subject = `[WorkNest] Pembayaran Berhasil - Invoice ${invoiceNumber}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background-color: #10b981; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Pembayaran Lunas</h1>
          <p style="color: #d1fae5; margin: 4px 0 0 0; font-size: 12px;">Terima kasih atas pembayaran Anda</p>
        </div>
        <div style="padding: 28px; font-size: 13px; line-height: 1.6; color: #334155;">
          <p>Halo <strong>${memberName}</strong>, pembayaran untuk invoice <strong>${invoiceNumber}</strong> sebesar <strong>Rp ${total.toLocaleString('id-ID')}</strong> melalui metode <strong>${method || 'Midtrans'}</strong> telah berhasil diverifikasi.</p>
        </div>
      </div>
    `;

    this.logger.log(`[EMAIL NOTIFICATION] Payment success for ${email}: ${invoiceNumber}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to: email, subject, html });
      } catch (err: any) {
        this.logger.error(`SMTP payment notification error: ${err.message}`);
      }
    }
  }
}
