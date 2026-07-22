import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { ContractService } from '../services/contract.service';
import { DailyPaymentReport, PAYMENT_METHOD_LABELS, PaymentMethod } from '../models/contract.model';

const PRODAVAC = {
  naziv: 'STR DUO ZRENJANIN MARIJA MRĐEN PR',
  adresa: 'Bagljaš Zapad 5, Zrenjanin',
  racun: '155-55730-48',
};

function fmt(n: number | null | undefined): string {
  if (n == null) return '';
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDateSr(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}.`;
}

function fmtTime(iso: string): string {
  const dt = new Date(iso);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzDatePickerModule,
    NzButtonModule, NzIconModule, NzTableModule,
  ],
  template: `
    <div style="padding: 24px;">

      <!-- Traka sa filterom (skrivena na štampi) -->
      <div class="no-print" style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
        <h2 style="margin:0;">Dnevni izveštaj o naplati rata</h2>
        <nz-date-picker [ngModel]="selectedDate" (ngModelChange)="onDateChange($event)"
          nzFormat="dd.MM.yyyy" style="margin-left:16px;"></nz-date-picker>
        <button nz-button nzType="primary" (click)="load()" [nzLoading]="loading">
          <span nz-icon nzType="reload"></span> Osveži
        </button>
        <button nz-button (click)="print()" [disabled]="!report">
          <span nz-icon nzType="printer"></span> Štampaj
        </button>
      </div>

      <div *ngIf="!report && !loading" class="no-print" style="color:#999;">Nema podataka.</div>

      <div class="report" *ngIf="report">

        <div class="report-header">
          <div class="bold" style="font-size:16px;">{{ PRODAVAC.naziv }}</div>
          <div>{{ PRODAVAC.adresa }}</div>
          <div class="title">DNEVNI IZVEŠTAJ O NAPLATI RATA</div>
          <div>Datum: <strong>{{ fmtDateSr(report.date) }}</strong></div>
        </div>

        <table class="summary-table">
          <thead>
            <tr><th>Način plaćanja</th><th>Iznos (din.)</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of methodKeys()">
              <td>{{ methodLabel(m) }}</td>
              <td class="right">{{ fmt(report.totalsByMethod[m]) }}</td>
            </tr>
            <tr class="total-row">
              <td><strong>UKUPNO</strong></td>
              <td class="right"><strong>{{ fmt(report.grandTotal) }}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Spisak uplata ({{ report.payments.length }})</div>

        <table class="detail-table" *ngIf="report.payments.length > 0">
          <thead>
            <tr>
              <th>Vreme</th>
              <th>Kupac</th>
              <th>Ugovor br.</th>
              <th>Rata</th>
              <th>Iznos (din.)</th>
              <th>Način plaćanja</th>
              <th>Radnik</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of report.payments">
              <td>{{ fmtTime(p.recordedAt) }}</td>
              <td>{{ p.customerFullName }}</td>
              <td class="center">{{ p.contractId }}</td>
              <td class="center">{{ p.installmentOrdinal }}</td>
              <td class="right">{{ fmt(p.amount) }}</td>
              <td>{{ methodLabel(p.paymentMethod) }}</td>
              <td>{{ p.recordedBy }}</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-row">
          <div class="signature-block">
            <p>Radnik</p>
            <div class="signature-line"></div>
          </div>
          <div class="signature-block">
            <p>Kontrolisao</p>
            <div class="signature-line"></div>
          </div>
        </div>

      </div>

      <!-- ═══════════════ UPLATNICA — gotovinske uplate ═══════════════ -->
      <div class="report page-break" *ngIf="report && cashTotal() > 0">
        <p class="title" style="font-size:13px;margin-bottom:12px;">
          UPLATNICA — gotovinske uplate za {{ fmtDateSr(report.date) }}
        </p>

        <div class="uplatnica">

          <!-- ── Leva strana: Nalog za uplatu ── -->
          <div class="uplat-left">
            <div class="uplat-top">
              <div class="uplat-info">
                <div class="f-label">platilac</div>
                <div class="f-box">{{ payerName() }}</div>
                <div class="f-label" style="margin-top:4px;">svrha uplate</div>
                <div class="f-box">Pazar — gotovinske uplate rata, {{ fmtDateSr(report.date) }}</div>
                <div class="f-label" style="margin-top:4px;">primalac</div>
                <div class="f-box">{{ PRODAVAC.naziv }}, {{ PRODAVAC.adresa }}</div>
              </div>

              <div class="uplat-amounts">
                <div class="amounts-row">
                  <div class="amounts-cell">
                    <div class="f-label-sm">šifra plaćanja</div>
                    <div class="f-box-sm">189</div>
                  </div>
                  <div class="amounts-cell">
                    <div class="f-label-sm">valuta</div>
                    <div class="f-box-sm">RSD</div>
                  </div>
                  <div class="amounts-cell flex2">
                    <div class="f-label-sm">iznos</div>
                    <div class="f-box-sm iznos-val">{{ fmt(cashTotal()) }}</div>
                  </div>
                </div>
                <div class="f-label">račun primaoca</div>
                <div class="f-box racun">{{ PRODAVAC.racun }}</div>
                <div class="f-label" style="margin-top:4px;">model i poziv na broj</div>
                <div class="amounts-row" style="margin-top:2px;">
                  <div class="f-box-sm" style="width:36px;"></div>
                  <div class="f-box-sm flex1"></div>
                </div>
              </div>
            </div>

            <div class="uplat-footer">
              <span class="f-label-sm">potpis platioca</span>
              <span class="f-label-sm">mesto i datum prijema</span>
              <span class="f-label-sm">datum izvršenja</span>
            </div>
          </div><!-- /uplat-left -->

          <!-- ── Separator ── -->
          <div class="uplat-sep">✂</div>

          <!-- ── Desna strana: Izveštaj o uplati ── -->
          <div class="uplat-right">
            <div class="f-label-sm" style="text-align:right;font-weight:bold;margin-bottom:4px;">Izveštaj o uplati</div>
            <div class="amounts-row">
              <div class="amounts-cell">
                <div class="f-label-sm">šifra plaćanja</div>
                <div class="f-box-sm">189</div>
              </div>
              <div class="amounts-cell">
                <div class="f-label-sm">valuta</div>
                <div class="f-box-sm">RSD</div>
              </div>
              <div class="amounts-cell flex2">
                <div class="f-label-sm">iznos</div>
                <div class="f-box-sm iznos-val">{{ fmt(cashTotal()) }}</div>
              </div>
            </div>
            <div class="f-label">račun primaoca</div>
            <div class="f-box racun">{{ PRODAVAC.racun }}</div>
            <div class="f-label" style="margin-top:3px;">platilac</div>
            <div class="f-box">{{ payerName() }}</div>
            <div class="f-label" style="margin-top:3px;">model i poziv na broj</div>
            <div class="amounts-row" style="margin-top:2px;">
              <div class="f-box-sm" style="width:36px;"></div>
              <div class="f-box-sm flex1"></div>
            </div>
            <div class="f-label" style="margin-top:3px;">primalac</div>
            <div class="f-box">{{ PRODAVAC.naziv }}, {{ PRODAVAC.adresa }}</div>
          </div><!-- /uplat-right -->

        </div><!-- /uplatnica -->
      </div>
    </div>
  `,
  styles: [`
    .report {
      background: #fff;
      font-family: Arial, sans-serif;
    }

    .report-header {
      text-align: center;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .title {
      font-size: 15px;
      font-weight: bold;
      margin: 10px 0 4px;
      text-transform: uppercase;
    }

    .bold { font-weight: bold; }

    .summary-table, .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }

    .summary-table th, .summary-table td,
    .detail-table th, .detail-table td {
      border: 1px solid #333;
      padding: 6px 10px;
    }

    .summary-table th, .detail-table th {
      background: #f0f0f0;
      text-align: left;
    }

    .total-row td { background: #f7f7f7; border-top: 2px solid #333; }

    .right { text-align: right; }
    .center { text-align: center; }

    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin: 16px 0 8px;
    }

    .signature-row {
      display: flex;
      justify-content: space-around;
      margin-top: 48px;
    }

    .signature-block {
      text-align: center;
      font-size: 12px;
      width: 220px;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-top: 40px;
    }

    /* ── Uplatnica (isti izgled kao na štampi ugovora) ── */
    .uplatnica {
      display: flex;
      align-items: stretch;
      border: 1px solid #555;
      margin-bottom: 8px;
      font-family: Arial, sans-serif;
      font-size: 10px;
      min-height: 82mm;
    }

    .uplat-left {
      flex: 2;
      display: flex;
      flex-direction: column;
      padding: 4px 6px;
    }

    .uplat-sep {
      flex: 0 0 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #aaa;
      border-left: 1px dashed #aaa;
      border-right: 1px dashed #aaa;
    }

    .uplat-right {
      flex: 1;
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .uplat-top {
      display: flex;
      gap: 6px;
      flex: 1;
    }

    .uplat-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .uplat-amounts {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .uplat-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #999;
      margin-top: 4px;
      padding-top: 3px;
    }

    .f-label { font-size: 9px; color: #444; margin-top: 2px; }
    .f-label-sm { font-size: 8.5px; color: #444; }

    .f-box {
      border: 1px solid #555;
      padding: 3px 5px;
      font-size: 10px;
      font-weight: bold;
      min-height: 18px;
      flex: 1;
    }

    .f-box-sm {
      border: 1px solid #555;
      padding: 2px 4px;
      font-size: 10px;
      font-weight: bold;
      min-height: 16px;
    }

    .racun {
      font-weight: bold;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    .iznos-val {
      min-width: 55px;
      text-align: right;
    }

    .amounts-row {
      display: flex;
      gap: 3px;
      align-items: flex-end;
    }

    .amounts-cell {
      display: flex;
      flex-direction: column;
    }

    .flex1 { flex: 1; }
    .flex2 { flex: 2; }

    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .uplatnica { page-break-inside: avoid; }

      @page {
        size: A4 portrait;
        margin: 15mm;
      }
    }
  `],
})
export class DailyReportComponent implements OnInit {
  report: DailyPaymentReport | null = null;
  loading = false;
  selectedDate: Date = new Date();

  readonly PRODAVAC = PRODAVAC;
  readonly fmt = fmt;
  readonly fmtDateSr = fmtDateSr;
  readonly fmtTime = fmtTime;

  constructor(
    private contractService: ContractService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onDateChange(date: Date): void {
    this.selectedDate = date;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.contractService.getDailyPaymentReport(toIsoDate(this.selectedDate)).subscribe({
      next: res => { this.report = res; this.loading = false; },
      error: () => {
        this.notification.error('Greška', 'Nije moguće učitati izveštaj');
        this.loading = false;
      }
    });
  }

  print(): void {
    window.print();
  }

  methodKeys(): PaymentMethod[] {
    if (!this.report) return [];
    return Object.keys(this.report.totalsByMethod) as PaymentMethod[];
  }

  methodLabel(m: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[m] ?? m;
  }

  cashTotal(): number {
    if (!this.report) return 0;
    return (this.report.totalsByMethod['GOTOVINA'] ?? 0) + (this.report.totalsByMethod['CASH'] ?? 0);
  }

  payerName(): string {
    return this.report?.payments[0]?.customerFullName ?? '';
  }
}
