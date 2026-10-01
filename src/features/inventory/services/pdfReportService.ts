import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { type InventoryTransaction } from '../../../core/sync/types';

export interface GeneratePdfOptions {
  dateString: string;
  transactions: InventoryTransaction[];
}

export const generateAndShareReportPdf = async ({
  dateString,
  transactions,
}: GeneratePdfOptions): Promise<void> => {
  const totalTransactions = transactions.length;
  let totalInbound = 0;
  let totalOutbound = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'INBOUND') {
      totalInbound += tx.quantity;
    } else {
      totalOutbound += tx.quantity;
    }
  });

  const rowsHtml = transactions.length === 0
    ? `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748B;">Tidak ada transaksi pada tanggal ini.</td></tr>`
    : transactions
        .map((tx, idx) => {
          const date = new Date(tx.created_at);
          const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          const isIncoming = tx.type === 'INBOUND';
          const typeColor = isIncoming ? '#16A34A' : '#DC2626';
          const qtySign = isIncoming ? `+${tx.quantity}` : `-${tx.quantity}`;

          return `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 12px; font-size: 11px; color: #64748B;">#${idx + 1}</td>
              <td style="padding: 10px 12px; font-size: 11px; color: #0F172A; font-family: monospace;">${time}</td>
              <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #0F172A; font-family: monospace;">${tx.sku}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155;">
                ${tx.item_name}
                ${tx.notes ? `<div style="font-size: 10px; color: #64748B; margin-top: 2px;">Catatan: ${tx.notes}</div>` : ''}
              </td>
              <td style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: ${typeColor};">
                ${tx.type}
              </td>
              <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: ${typeColor}; text-align: right; font-family: monospace;">
                ${qtySign}
              </td>
            </tr>
          `;
        })
        .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Laporan Mutasi Barang - ${dateString}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 32px;
            background: #FFFFFF;
          }
          .header {
            border-bottom: 2px solid #0F172A;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #0F172A;
            margin: 0;
          }
          .brand-subtitle {
            font-size: 12px;
            color: #64748B;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .report-meta {
            text-align: right;
          }
          .report-date {
            font-size: 14px;
            font-weight: 700;
            color: #0F172A;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .summary-card {
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 12px 16px;
            background: #F8FAFC;
          }
          .summary-card-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .summary-card-value {
            font-size: 18px;
            font-weight: 700;
            color: #0F172A;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th {
            background: #F1F5F9;
            color: #475569;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #CBD5E1;
          }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">FIELDSYNC ENTERPRISE</h1>
            <div class="brand-subtitle">Laporan Mutasi Pergudangan & Inventaris</div>
          </div>
          <div class="report-meta">
            <div class="report-date">${dateString}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Offline-First Architecture</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-label">Total Transaksi</div>
            <div class="summary-card-value">${totalTransactions} Catatan</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Total Masuk</div>
            <div class="summary-card-value" style="color: #16A34A;">+${totalInbound} Unit</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Total Keluar</div>
            <div class="summary-card-value" style="color: #DC2626;">-${totalOutbound} Unit</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 70px;">Waktu</th>
              <th style="width: 120px;">SKU</th>
              <th>Nama Barang & Keterangan</th>
              <th style="width: 100px;">Tipe</th>
              <th style="width: 90px; text-align: right;">Kuantitas</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Dicetak secara otomatis dari FieldSync Engine</div>
          <div>Tanggal Pembuatan: ${new Date().toLocaleString('id-ID')}</div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Unduh Laporan Mutasi - ${dateString}`,
    });
  }
};
