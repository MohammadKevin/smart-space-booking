import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService, SnapTokenResult } from './midtrans.service';
import { ReservasiStatus, PembayaranStatus, Role } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
  ) {}

  private generateInvoiceNumber(reservationId: number): string {
    const stamp = Date.now().toString().slice(-6);
    return `INV-${reservationId}-${stamp}`;
  }

  private assertOwnerScope(reservationOwnerId: number, user: any) {
    if (user.role === Role.admin_space) {
      if (user.spaceOwner?.id !== reservationOwnerId) {
        throw new ForbiddenException(
          'Transaksi ini bukan milik coworking space Anda.',
        );
      }
    } else if (user.role === Role.staff) {
      if (user.staff?.ownerId !== reservationOwnerId) {
        throw new ForbiddenException(
          'Transaksi ini bukan milik coworking space tempat Anda bertugas.',
        );
      }
    }
  }

  private async findScoped(id: number, user: any) {
    const tx = await this.prisma.transaksi.findUnique({
      where: { id },
      include: {
        reservasi: {
          include: {
            member: true,
            detailReservasi: {
              include: { space: true, diskon: true },
            },
          },
        },
      },
    });

    if (!tx) {
      throw new NotFoundException(`Transaksi dengan ID ${id} tidak ditemukan.`);
    }

    if (
      user.role === Role.member &&
      user.member?.id !== tx.reservasi.memberId
    ) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk melihat transaksi ini.',
      );
    }
    this.assertOwnerScope(tx.reservasi.ownerId, user);

    return tx;
  }

  /** Ensure a Transaksi record exists for a reservation (created lazily). */
  private async ensureTransaction(reservationId: number, jumlah: number) {
    let tx = await this.prisma.transaksi.findUnique({
      where: { reservasiId: reservationId },
    });

    if (!tx) {
      tx = await this.prisma.transaksi.create({
        data: {
          nomorInvoice: this.generateInvoiceNumber(reservationId),
          reservasiId: reservationId,
          jumlah,
          statusPembayaran: PembayaranStatus.menunggu_pembayaran,
        },
      });
    }

    return tx;
  }

  /**
   * Member starts payment via Midtrans Snap.
   * Returns the snap token + redirect URL + client metadata for the frontend.
   */
  async startPayment(reservationId: number, memberUserId: number) {
    const member = await this.prisma.member.findUnique({
      where: { userId: memberUserId },
      include: { user: { select: { email: true } } },
    });
    if (!member) {
      throw new ForbiddenException(
        'Hanya akun Member yang dapat melakukan pembayaran.',
      );
    }

    const reservation = await this.prisma.reservasi.findUnique({
      where: { id: reservationId },
      include: { detailReservasi: true },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservasi dengan ID ${reservationId} tidak ditemukan.`,
      );
    }
    if (reservation.memberId !== member.id) {
      throw new ForbiddenException('Reservasi ini bukan milik Anda.');
    }

    // Payment is only allowed once the owner/staff approve the booking.
    if (reservation.status !== ReservasiStatus.disetujui) {
      throw new BadRequestException(
        'Pembayaran hanya dapat dilakukan setelah reservasi disetujui. Saat ini status: ' +
          reservation.status +
          '.',
      );
    }

    const jumlah = reservation.detailReservasi?.totalHarga ?? 0;
    if (jumlah <= 0) {
      throw new BadRequestException('Total pembayaran tidak valid (Rp 0).');
    }

    const tx = await this.ensureTransaction(reservationId, jumlah);

    if (tx.statusPembayaran === PembayaranStatus.lunas) {
      throw new BadRequestException('Transaksi ini sudah berstatus lunas.');
    }
    if (tx.statusPembayaran === PembayaranStatus.refund) {
      throw new BadRequestException(
        'Transaksi ini telah di-refund dan tidak dapat dibayar ulang.',
      );
    }

    const orderId = tx.nomorInvoice;

    const snap: SnapTokenResult = await this.midtrans.createSnapToken({
      orderId,
      grossAmount: tx.jumlah,
      firstName: member.namaMember,
      email: member.user?.email || undefined,
      phone: member.telp,
    });

    await this.prisma.transaksi.update({
      where: { id: tx.id },
      data: {
        snapToken: snap.token,
        snapRedirectUrl: snap.redirect_url,
        midtransOrderId: orderId,
        statusPembayaran: PembayaranStatus.menunggu_pembayaran,
      },
    });

    return {
      message:
        'Snap pembayaran berhasil dibuat. Silakan selesaikan pembayaran.',
      data: {
        transactionId: tx.id,
        nomorInvoice: tx.nomorInvoice,
        jumlah: tx.jumlah,
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
        clientKey: this.midtrans.clientKey,
        snapScriptUrl: this.midtrans.snapScriptUrl,
      },
    };
  }

  /** Public webhook receiver called by Midtrans on payment status changes. */
  async handleNotification(
    payload: Record<string, any>,
  ): Promise<{ success: boolean }> {
    const orderId = payload.order_id;
    const statusCode = String(payload.status_code ?? '');
    const grossAmount = String(payload.gross_amount ?? '');
    const signatureKey = payload.signature_key ?? '';
    const transactionStatus = payload.transaction_status;

    if (
      !orderId ||
      !signatureKey ||
      !this.midtrans.verifySignature(
        orderId,
        statusCode,
        grossAmount,
        signatureKey,
      )
    ) {
      throw new BadRequestException(
        'Signature notifikasi Midtrans tidak valid.',
      );
    }

    const tx = await this.prisma.transaksi.findUnique({
      where: { midtransOrderId: orderId },
    });

    if (!tx) {
      throw new NotFoundException(
        `Transaksi dengan order ID '${orderId}' tidak ditemukan.`,
      );
    }

    let status: PembayaranStatus;
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      status = PembayaranStatus.lunas;
    } else if (transactionStatus === 'pending') {
      status = PembayaranStatus.menunggu_pembayaran;
    } else {
      // 'expire', 'cancel', 'deny', 'failure'
      status = PembayaranStatus.gagal;
    }

    await this.prisma.transaksi.update({
      where: { id: tx.id },
      data: {
        statusPembayaran: status,
        metodePembayaran: payload.payment_type || tx.metodePembayaran,
        midtransTransId: payload.transaction_id || tx.midtransTransId,
        dibayarPada:
          status === PembayaranStatus.lunas ? new Date() : tx.dibayarPada,
      },
    });

    return { success: true };
  }

  /** Member/owner/staff reconcile payment status against Midtrans by order id. */
  async syncPayment(id: number, user: any) {
    const tx = await this.findScoped(id, user);
    if (!tx.midtransOrderId) {
      throw new BadRequestException(
        'Belum ada order pembayaran yang dibuat untuk transaksi ini.',
      );
    }

    const mt = await this.midtrans.getTransactionStatus(tx.midtransOrderId);
    const transactionStatus = mt.transaction_status;

    let status: PembayaranStatus;
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      status = PembayaranStatus.lunas;
    } else if (transactionStatus === 'pending') {
      status = PembayaranStatus.menunggu_pembayaran;
    } else {
      status = PembayaranStatus.gagal;
    }

    const updated = await this.prisma.transaksi.update({
      where: { id: tx.id },
      data: {
        statusPembayaran: status,
        metodePembayaran: mt.payment_type || tx.metodePembayaran,
        midtransTransId: mt.transaction_id || tx.midtransTransId,
        dibayarPada:
          status === PembayaranStatus.lunas ? new Date() : tx.dibayarPada,
      },
      include: {
        reservasi: {
          include: {
            member: true,
            detailReservasi: { include: { space: true, diskon: true } },
          },
        },
      },
    });

    return { message: 'Status pembayaran diperbarui.', data: updated };
  }

  /** List transactions scoped by role (member sees own, owner/staff sees space's). */
  async findAll(user: any, spaceId?: number) {
    if (!this.prisma.transaksi) {
      return [];
    }

    const where: any = {};

    if (user.role === Role.member) {
      if (!user.member) {
        throw new ForbiddenException('Profil member tidak ditemukan.');
      }
      where.reservasi = { memberId: user.member.id };
    } else if (user.role === Role.admin_space) {
      if (!user.spaceOwner) {
        throw new ForbiddenException('Profil coworking space tidak ditemukan.');
      }
      where.reservasi = { ownerId: user.spaceOwner.id };
    } else if (user.role === Role.staff) {
      if (!user.staff) {
        throw new ForbiddenException('Profil staff tidak ditemukan.');
      }
      where.reservasi = { ownerId: user.staff.ownerId };
    } else {
      throw new ForbiddenException('Role tidak dikenali.');
    }

    if (spaceId) {
      where.reservasi = {
        ...where.reservasi,
        detailReservasi: {
          spaceId: spaceId,
        },
      };
    }

    return this.prisma.transaksi.findMany({
      where,
      include: {
        reservasi: {
          include: {
            member: true,
            detailReservasi: { include: { space: true, diskon: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Role-scoped detail lookup. */
  async findOne(id: number, user: any) {
    const tx = await this.findScoped(id, user);
    return tx;
  }

  /**
   * Owner/Staff mark a paid transaction as refunded (e.g. after cancel before check-in).
   */
  async markRefund(id: number, user: any) {
    if (user.role !== Role.admin_space && user.role !== Role.staff) {
      throw new ForbiddenException(
        'Hanya admin space dan staff yang dapat melakukan refund.',
      );
    }

    const tx = await this.findScoped(id, user);

    if (tx.statusPembayaran !== PembayaranStatus.lunas) {
      throw new BadRequestException(
        'Hanya transaksi berstatus lunas yang dapat di-refund.',
      );
    }

    const updated = await this.prisma.transaksi.update({
      where: { id: tx.id },
      data: { statusPembayaran: PembayaranStatus.refund },
      include: {
        reservasi: {
          include: {
            member: true,
            detailReservasi: { include: { space: true, diskon: true } },
          },
        },
      },
    });

    return { message: 'Transaksi ditandai sebagai refund.', data: updated };
  }
}
