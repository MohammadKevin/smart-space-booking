import * as PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  nomorInvoice: string;
  qrCode: string;
  tanggalTransaksi: Date | string;
  dibayarPada?: Date | string | null;
  metodePembayaran?: string | null;
  statusPembayaran: string;
  member: {
    namaMember: string;
    email: string;
    telp?: string | null;
    instansi?: string | null;
    alamat?: string | null;
  };
  owner: {
    namaCoworking: string;
    namaPemilik?: string | null;
    alamat?: string | null;
    telp?: string | null;
  };
  space: {
    namaSpace: string;
    tipe: string;
    hargaPerJam: number;
  };
  reservasi: {
    tanggalReservasi: Date | string;
    jamMulai: string;
    jamSelesai?: string;
    durasiJam: number;
  };
  diskon?: {
    namaDiskon: string;
    kodeDiskon?: string | null;
    persentaseDiskon: number;
    potongan: number;
  } | null;
  subtotal: number;
  total: number;
}

function formatCurrency(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function formatDateStr(dateInput: Date | string): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

function formatDateTimeStr(dateInput?: Date | string | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) +
      ' ' +
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) +
      ' WIB'
    );
  } catch {
    return String(dateInput);
  }
}

export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new (PDFDocument as any)({
      size: 'A4',
      margin: 45,
      info: {
        Title: `Invoice ${data.nomorInvoice} - WorkNest`,
        Author: 'WorkNest Platform',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err: Error) => reject(err));

    doc.rect(0, 0, 595.28, 8).fill('#0284c7');

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('WorkNest', 45, 35);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#64748b')
      .text('Smart Coworking & Space Booking Platform', 45, 60);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#0284c7')
      .text('BUKTI PEMBAYARAN', 320, 35, { align: 'right' });
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#15803d')
      .text('STATUS: LUNAS (PAID)', 320, 55, { align: 'right' });

    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(45, 80)
      .lineTo(550, 80)
      .stroke();

    const invoiceY = 95;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('NOMOR INVOICE', 45, invoiceY);
    doc.text('TANGGAL INVOICE', 180, invoiceY);
    doc.text('WAKTU LUNAS', 315, invoiceY);
    doc.text('METODE PEMBAYARAN', 450, invoiceY);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text(data.nomorInvoice, 45, invoiceY + 12);
    doc.text(formatDateStr(data.tanggalTransaksi), 180, invoiceY + 12);
    doc.text(formatDateTimeStr(data.dibayarPada), 315, invoiceY + 12);
    doc.text((data.metodePembayaran || 'Midtrans').toUpperCase(), 450, invoiceY + 12);

    doc
      .rect(45, 130, 505, 75)
      .fillAndStroke('#f8fafc', '#e2e8f0');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#0284c7')
      .text('DITERBITKAN UNTUK (MEMBER):', 55, 140);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(data.member.namaMember, 55, 155);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Email: ${data.member.email}`, 55, 170)
      .text(`Telepon: ${data.member.telp || '-'} | Instansi: ${data.member.instansi || 'Personal'}`, 55, 183);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#0284c7')
      .text('LOKASI COWOKING SPACE (MERCHANT):', 310, 140);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(data.owner.namaCoworking, 310, 155);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Alamat: ${data.owner.alamat || 'Indonesia'}`, 310, 170, { width: 230 })
      .text(`Kontak Pengelola: ${data.owner.telp || '-'}`, 310, 188);

    const tableY = 220;
    doc
      .rect(45, tableY, 505, 22)
      .fill('#0f172a');

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('DESKRIPSI SEWA RUANGAN', 55, tableY + 6);
    doc.text('DURASI', 310, tableY + 6);
    doc.text('TARIF / JAM', 380, tableY + 6);
    doc.text('TOTAL', 470, tableY + 6, { align: 'right', width: 70 });

    const itemY = tableY + 28;
    doc
      .rect(45, itemY - 6, 505, 55)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(data.space.namaSpace, 55, itemY);

    const scheduleStr = `Jadwal: ${formatDateStr(data.reservasi.tanggalReservasi)}, Pukul ${data.reservasi.jamMulai} - ${data.reservasi.jamSelesai || '-'} WIB`;
    const typeLabel = data.space.tipe === 'meeting_room' ? 'Ruang Rapat (Meeting Room)' : data.space.tipe === 'private_office' ? 'Suite Kantor Privat' : 'Dedicated Flex Hot Desk';

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Kategori: ${typeLabel}`, 55, itemY + 15)
      .text(scheduleStr, 55, itemY + 27);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(`${data.reservasi.durasiJam} Jam`, 310, itemY + 10);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(formatCurrency(data.space.hargaPerJam), 380, itemY + 10);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(formatCurrency(data.subtotal), 470, itemY + 10, { align: 'right', width: 70 });

    const summaryY = itemY + 60;

    doc
      .rect(45, summaryY, 260, 95)
      .fillAndStroke('#eff6ff', '#bfdbfe');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('KODE TIKET QR AKSES RUANGAN:', 55, summaryY + 10);

    doc
      .fontSize(14)
      .font('Courier-Bold')
      .fillColor('#0284c7')
      .text(data.qrCode, 55, summaryY + 25);

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#334155')
      .text(
        'Tunjukkan kode tiket QR ini kepada staf resepsionis atau lakukan scan pada terminal pintu saat memasuki coworking space.',
        55,
        summaryY + 46,
        { width: 240 }
      );

    const calcX = 320;
    let currY = summaryY + 5;

    doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text('Subtotal Sewa:', calcX, currY);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(formatCurrency(data.subtotal), 450, currY, { align: 'right', width: 95 });

    if (data.diskon && data.diskon.potongan > 0) {
      currY += 18;
      const promoLabel = `Diskon (${data.diskon.kodeDiskon || data.diskon.namaDiskon} - ${data.diskon.persentaseDiskon}%):`;
      doc.font('Helvetica').fillColor('#16a34a').text(promoLabel, calcX, currY);
      doc.font('Helvetica-Bold').fillColor('#16a34a').text(`- ${formatCurrency(data.diskon.potongan)}`, 450, currY, { align: 'right', width: 95 });
    }

    currY += 18;
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(calcX, currY).lineTo(550, currY).stroke();

    currY += 8;
    doc.rect(calcX - 5, currY - 4, 235, 26).fill('#f1f5f9');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('TOTAL DIBAYAR:', calcX, currY + 4);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0284c7').text(formatCurrency(data.total), 440, currY + 2, { align: 'right', width: 105 });

    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(45, 730)
      .lineTo(550, 730)
      .stroke();

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text(
        'Faktur elektronik ini diterbitkan secara otomatis oleh sistem WorkNest dan sah tanpa tanda tangan basah.',
        45,
        740,
        { align: 'center', width: 505 }
      )
      .text(
        `© ${new Date().getFullYear()} WorkNest Coworking & Space Booking. Hak cipta dilindungi. Layanan Bantuan: support@worknest.app`,
        45,
        753,
        { align: 'center', width: 505 }
      );

    doc.end();
  });
}
