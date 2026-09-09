import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService, SnapTokenResult } from './midtrans.service';
import { MailService } from '../common/mail/mail.service';
import { ReservasiStatus, PembayaranStatus, Role } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
    private readonly mailService: MailService,
  ) {}

  private generateInvoiceNumber(reservationId: number, ownerId?: number): string {
    const stamp = Date.now().toString().slice(-6);
    const ownerTag = ownerId ? `OWNER${ownerId}-` : '';
    return `INV-${ownerTag}RES${reservationId}-${stamp}`;
  }

  private assertOwnerScope(reservationOwnerId: number, user: any) {
    if (user.role === Role.super_admin) {
      return;
    }
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
    const tx = await this.prisma.transaksi.findFirst({
      where: {
        OR: [{ id }, { reservasiId: id }],
      },
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
      throw new NotFoundException(`Transaksi dengan ID / Reservasi ID ${id} tidak ditemukan.`);
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

  private async ensureTransaction(
    reservationId: number,
    jumlah: number,
    ownerId?: number,
  ) {
    let tx = await this.prisma.transaksi.findUnique({
      where: { reservasiId: reservationId },
    });

    if (!tx) {
      tx = await this.prisma.transaksi.create({
        data: {
          nomorInvoice: this.generateInvoiceNumber(reservationId, ownerId),
          reservasiId: reservationId,
          jumlah,
          statusPembayaran: PembayaranStatus.menunggu_pembayaran,
        },
      });
    }

    return tx;
  }

  async startPayment(
    reservationId: number,
    memberUserId: number,
    paymentMethod?: string,
  ) {
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
      include: {
        owner: true,
        detailReservasi: {
          include: {
            space: true,
            diskon: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservasi dengan ID ${reservationId} tidak ditemukan.`,
      );
    }
    if (reservation.memberId !== member.id) {
      throw new ForbiddenException('Reservasi ini bukan milik Anda.');
    }

    if (
      reservation.status !== ReservasiStatus.pending &&
      reservation.status !== ReservasiStatus.disetujui
    ) {
      throw new BadRequestException(
        'Pembayaran tidak dapat dilakukan karena reservasi berstatus ' +
          reservation.status +
          '.',
      );
    }

    const jumlah = reservation.detailReservasi?.totalHarga ?? 0;
    if (jumlah <= 0) {
      throw new BadRequestException('Total pembayaran tidak valid (Rp 0).');
    }

    const tx = await this.ensureTransaction(
      reservationId,
      jumlah,
      reservation.ownerId,
    );

    if (tx.statusPembayaran === PembayaranStatus.lunas) {
      throw new BadRequestException('Transaksi ini sudah berstatus lunas.');
    }
    if (tx.statusPembayaran === PembayaranStatus.refund) {
      throw new BadRequestException(
        'Transaksi ini telah di-refund dan tidak dapat dibayar ulang.',
      );
    }

    const paymentMethodClean = (paymentMethod || 'qris').toLowerCase();
    const orderId = `${tx.nomorInvoice}-${Date.now()}`;
    const ownerId = reservation.ownerId;
    const coworkingName = reservation.owner?.namaCoworking || 'Coworking Space';
    const spaceId = reservation.detailReservasi?.spaceId || 0;
    const spaceName = reservation.detailReservasi?.space?.namaSpace || 'Ruangan';
    const durasiJam = reservation.durasiJam || 1;

    const itemDetails = [
      {
        id: `SPACE-${spaceId}`,
        price: Math.round(tx.jumlah),
        quantity: 1,
        name: `[${coworkingName}] ${spaceName} (${durasiJam} Jam)`.slice(0, 50),
        merchant_name: coworkingName.slice(0, 50),
      },
    ];
    const customField1 = `OwnerID:${ownerId}|${coworkingName}`.slice(0, 255);
    const customField2 = `SpaceID:${spaceId}|${spaceName}`.slice(0, 255);
    const customField3 = `MemberID:${member.id}|UserID:${memberUserId}`.slice(0, 255);

    let directChargeResult: any = null;
    if (paymentMethod && paymentMethod !== 'snap' && paymentMethod !== 'credit_card') {
      try {
        directChargeResult = await this.midtrans.chargeDirectPayment({
          orderId,
          grossAmount: tx.jumlah,
          paymentMethod,
          firstName: member.namaMember,
          email: member.user?.email || undefined,
          phone: member.telp,
          itemDetails,
          customField1,
          customField2,
          customField3,
        });
      } catch {}
    }

    const snap: SnapTokenResult = await this.midtrans.createSnapToken({
      orderId,
      grossAmount: tx.jumlah,
      firstName: member.namaMember,
      email: member.user?.email || undefined,
      phone: member.telp,
      itemDetails,
      customField1,
      customField2,
      customField3,
    });

    await this.prisma.transaksi.update({
      where: { id: tx.id },
      data: {
        snapToken: snap.token,
        snapRedirectUrl: snap.redirect_url,
        midtransOrderId: orderId,
        metodePembayaran: paymentMethod || tx.metodePembayaran,
        statusPembayaran: PembayaranStatus.menunggu_pembayaran,
      },
    });

    return {
      message:
        'Informasi pembayaran berhasil dibuat. Silakan selesaikan pembayaran.',
      data: {
        transactionId: tx.id,
        nomorInvoice: tx.nomorInvoice,
        jumlah: tx.jumlah,
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
        clientKey: this.midtrans.clientKey,
        snapScriptUrl: this.midtrans.snapScriptUrl,
        directPayment: directChargeResult,
      },
    };
  }

  async handleNotification(
    payload: Record<string, any>,
  ): Promise<{ success: boolean }> {
    const orderId = payload.order_id;
    const statusCode = String(payload.status_code ?? '');
    const grossAmount = String(payload.gross_amount ?? '');
    const signatureKey = payload.signature_key ?? '';
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

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

    const tx = await this.prisma.transaksi.findFirst({
      where: {
        OR: [
          { midtransOrderId: orderId },
          { nomorInvoice: orderId },
          {
            nomorInvoice: orderId
              .split('-BCA')[0]
              .split('-BNI')[0]
              .split('-BRI')[0]
              .split('-MANDIRI')[0]
              .split('-QRIS')[0]
              .split('-PERMATA')[0]
              .split('-GOPAY')[0]
              .split('-SHOPEEPAY')[0],
          },
          { midtransOrderId: { startsWith: orderId.slice(0, 18) } },
        ],
      },
      include: {
        reservasi: {
          include: {
            member: {
              include: { user: true },
            },
            detailReservasi: { include: { space: true, diskon: true } },
          },
        },
      },
    });

    if (!tx) {
      throw new NotFoundException(
        `Transaksi dengan order ID '${orderId}' tidak ditemukan.`,
      );
    }

    // Idempotency: if already marked lunas and notification is settlement, skip redundant processing
    if (
      tx.statusPembayaran === PembayaranStatus.lunas &&
      (transactionStatus === 'settlement' || transactionStatus === 'capture')
    ) {
      return { success: true };
    }

    let status: PembayaranStatus;
    if (
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && (!fraudStatus || fraudStatus === 'accept'))
    ) {
      status = PembayaranStatus.lunas;
    } else if (transactionStatus === 'pending') {
      status = PembayaranStatus.menunggu_pembayaran;
    } else {
      status = PembayaranStatus.gagal;
    }

    const isNewlyPaid = status === PembayaranStatus.lunas && !tx.dibayarPada;

    const updated = await this.prisma.transaksi.update({
      where: { id: tx.id },
      data: {
        statusPembayaran: status,
        metodePembayaran: payload.payment_type || tx.metodePembayaran,
        midtransTransId: payload.transaction_id || tx.midtransTransId,
        dibayarPada:
          status === PembayaranStatus.lunas ? (tx.dibayarPada || new Date()) : tx.dibayarPada,
      },
      include: {
        reservasi: {
          include: {
            member: {
              include: { user: true },
            },
            detailReservasi: { include: { space: true, diskon: true } },
          },
        },
      },
    });

    if (status === PembayaranStatus.lunas && updated.reservasi?.status === ReservasiStatus.pending) {
      await this.prisma.reservasi.update({
        where: { id: updated.reservasi.id },
        data: { status: ReservasiStatus.disetujui },
      });
    }

    if (isNewlyPaid && updated.reservasi?.member?.user?.email) {
      const email = updated.reservasi.member.user.email;
      const memberName = updated.reservasi.member.namaMember;
      const spaceName = updated.reservasi.detailReservasi?.space?.namaSpace || 'Space';
      const invoiceNum = updated.nomorInvoice;
      const totalAmount = updated.jumlah;
      const method = updated.metodePembayaran || 'Midtrans';

      this.mailService
        .sendPaymentSuccessEmail(
          email,
          memberName,
          spaceName,
          invoiceNum,
          totalAmount,
          method,
        )
        .catch(() => {});
    }

    return { success: true };
  }

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
            member: {
              include: { user: true },
            },
            detailReservasi: { include: { space: true, diskon: true } },
          },
        },
      },
    });

    if (status === PembayaranStatus.lunas && updated.reservasi?.status === ReservasiStatus.pending) {
      await this.prisma.reservasi.update({
        where: { id: updated.reservasi.id },
        data: { status: ReservasiStatus.disetujui },
      });
    }

    if (status === PembayaranStatus.lunas && updated.reservasi?.member?.user?.email) {
      const email = updated.reservasi.member.user.email;
      const memberName = updated.reservasi.member.namaMember;
      const spaceName = updated.reservasi.detailReservasi?.space?.namaSpace || 'Space';
      const invoiceNum = updated.nomorInvoice;
      const totalAmount = updated.jumlah;
      const method = updated.metodePembayaran || 'Midtrans';

      this.mailService
        .sendPaymentSuccessEmail(
          email,
          memberName,
          spaceName,
          invoiceNum,
          totalAmount,
          method,
        )
        .catch(() => {});
    }

    return { message: 'Status pembayaran diperbarui.', data: updated };
  }

  async findAll(user: any, spaceId?: number) {
    if (!this.prisma.transaksi) {
      return [];
    }

    const where: any = {};

    if (user.role === Role.super_admin) {
      // Super admin can see all transactions
    } else if (user.role === Role.member) {
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

  async findOne(id: number, user: any) {
    const tx = await this.findScoped(id, user);
    return tx;
  }

  async markRefund(id: number, user: any) {
    if (
      user.role !== Role.super_admin &&
      user.role !== Role.admin_space &&
      user.role !== Role.staff
    ) {
      throw new ForbiddenException(
        'Hanya super admin, admin space, dan staff yang dapat melakukan refund.',
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
