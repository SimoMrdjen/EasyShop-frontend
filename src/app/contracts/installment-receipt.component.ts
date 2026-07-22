import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { NzIconModule } from 'ng-zorro-antd/icon';

import { ContractService } from '../services/contract.service';
import { ContractResponse, InstallmentResponse, PAYMENT_METHOD_LABELS, PaymentMethod } from '../models/contract.model';

const PRODAVAC = {
  naziv: 'STR DUO ZRENJANIN',
  zastupnik: 'MARIJA MRĐEN PR',
  adresa: 'Bagljaš Zapad 5, Zrenjanin',
  pib: '100907791',
};

function fmt(n: number | null | undefined): string {
  if (n == null) return '';
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}.`;
}

function fmtDateTime(d: Date): string {
  return `${fmtDate(d.toISOString())} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-installment-receipt',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  template: `
    <div *ngIf="!contract || !installment" style="padding:40px;text-align:center;">Učitavanje...</div>

    <ng-container *ngIf="contract && installment">
      <div class="no-print action-bar">
        <button onclick="window.print()"
          style="padding:8px 24px;font-size:14px;cursor:pointer;background:#1890ff;color:#fff;border:none;border-radius:4px;margin-right:8px;">
          Štampaj
        </button>
        <button (click)="goBack()"
          style="padding:8px 16px;font-size:14px;cursor:pointer;background:#fff;border:1px solid #d9d9d9;border-radius:4px;">
          <span nz-icon nzType="arrow-left"></span> Nazad na ugovor
        </button>
      </div>

      <div class="receipt">
        <div class="center bold">{{ PRODAVAC.naziv }}</div>
        <div class="center">{{ PRODAVAC.zastupnik }}</div>
        <div class="center">{{ PRODAVAC.adresa }}</div>
        <div class="center">PIB: {{ PRODAVAC.pib }}</div>

        <div class="sep"></div>
        <div class="center bold">POTVRDA O UPLATI RATE</div>
        <div class="sep"></div>

        <div class="row"><span>Ugovor br:</span><span class="bold">{{ contract.id }}</span></div>
        <div class="row"><span>Kupac:</span><span class="bold">{{ contract.customerFullName }}</span></div>
        <div class="row"><span>Rata:</span><span class="bold">{{ installment.installmentOrdinal }}/{{ contract.numberOfInstallments }}</span></div>

        <div class="sep"></div>

        <div class="row"><span>Iznos rate:</span><span>{{ fmt(installment.installmentAmount) }}</span></div>
        <div class="row"><span>Uplaćeno:</span><span class="bold">{{ fmt(installment.paidAmount) }} din.</span></div>
        <div class="row"><span>Način plaćanja:</span><span>{{ methodLabel(installment.paymentMethod) }}</span></div>
        <div class="row"><span>Datum uplate:</span><span>{{ fmtDate(installment.paymentDate) }}</span></div>

        <div class="sep"></div>

        <div class="row"><span>Preostalo po ugovoru:</span><span class="bold">{{ fmt(remainingBalance()) }} din.</span></div>

        <div class="sep"></div>

        <div class="center small">Datum štampe: {{ printedAt }}</div>
        <div class="sep"></div>
        <div class="center bold" style="margin-top:6px;">Hvala na poverenju!</div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host { display: block; background: #e8e8e8; }

    .action-bar {
      background: #fff;
      padding: 12px 24px;
      border-bottom: 1px solid #d9d9d9;
      position: sticky; top: 0; z-index: 10;
    }

    .receipt {
      width: 72mm;
      margin: 16px auto;
      padding: 4mm;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
    }

    .center { text-align: center; }
    .bold { font-weight: bold; }
    .small { font-size: 10px; }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .sep {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    @page {
      size: 80mm auto;
      margin: 0;
    }

    @media print {
      :host { background: #fff; }
      .no-print { display: none !important; }

      .receipt {
        width: 72mm;
        margin: 0 auto;
        padding: 3mm 4mm;
        box-shadow: none;
      }
    }
  `],
})
export class InstallmentReceiptComponent implements OnInit {
  contract: ContractResponse | null = null;
  installment: InstallmentResponse | null = null;
  printedAt = fmtDateTime(new Date());

  readonly PRODAVAC = PRODAVAC;
  readonly fmt = fmt;
  readonly fmtDate = fmtDate;

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const contractId = Number(this.route.snapshot.paramMap.get('id'));
    const installmentId = Number(this.route.snapshot.paramMap.get('installmentId'));

    this.contractService.getContractById(contractId).subscribe({
      next: contract => {
        this.contract = contract;
        this.installment = contract.installments.find(i => i.id === installmentId) ?? null;
      }
    });
  }

  methodLabel(m: PaymentMethod | undefined): string {
    return m ? (PAYMENT_METHOD_LABELS[m] ?? m) : '—';
  }

  remainingBalance(): number {
    if (!this.contract) return 0;
    const totalPaid = this.contract.installments.reduce((sum, i) => sum + (i.paidAmount ?? 0), 0);
    return Math.max(0, this.contract.financeAmount - totalPaid);
  }

  goBack(): void {
    this.router.navigate(['/contracts', this.contract!.id]);
  }
}
