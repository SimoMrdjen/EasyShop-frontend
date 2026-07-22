import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ContractService } from '../services/contract.service';
import { UserService } from '../services/user.service';
import { ContractResponse, InstallmentResponse } from '../models/contract.model';
import { UserResponse } from '../models/user.model';

const PRODAVAC = {
  naziv: 'STR DUO ZRENJANIN MARIJA MRĐEN PR',
  ulica: 'Bagljaš Zapad 5',
  mesto: 'Zrenjanin',
  adresa: 'Bagljaš Zapad 5, Zrenjanin',
  pib: '100907791',
  mbr: '54406177',
  zastupnik: 'Marija Mrđen',
  grad: 'Zrenjaninu',
  racun: '155-55730-48',
  // IPS: R tag mora biti 18 numeričkih cifara bez crtica
  racunIPS: '155000000005573048',
  nazivIPS: 'MARIJA MRDEN PR STR DUO',
};

function fmt(n: number | null | undefined): string {
  if (n == null) return '';
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function latinize(s: string): string {
  return s
    .replace(/[Đđ]/g, m => m === 'Đ' ? 'DJ' : 'dj')
    .replace(/[Ćć]/g, m => m === 'Ć' ? 'C' : 'c')
    .replace(/[Šš]/g, m => m === 'Š' ? 'S' : 's')
    .replace(/[Žž]/g, m => m === 'Ž' ? 'Z' : 'z')
    .replace(/[Čč]/g, m => m === 'Č' ? 'C' : 'c');
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

@Component({
  selector: 'app-contract-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!contract || !customer" style="padding:40px;text-align:center;">Učitavanje...</div>

    <ng-container *ngIf="contract && customer">

      <!-- ─── Akcioni bar (skriven na štampi) ─── -->
      <div class="no-print action-bar">
        <button onclick="window.print()"
          style="padding:8px 24px;font-size:14px;cursor:pointer;background:#1890ff;color:#fff;border:none;border-radius:4px;margin-right:8px;">
          Štampaj
        </button>
        <button onclick="window.history.back()"
          style="padding:8px 16px;font-size:14px;cursor:pointer;background:#fff;border:1px solid #d9d9d9;border-radius:4px;">
          ← Nazad
        </button>
      </div>

      <!-- ═══════════════════════════════
           UGOVOR — sadržaj (ng-template, koristi se 2×)
      ═══════════════════════════════ -->
      <ng-template #ugovorContent>
        <p class="title">UGOVOR O PRODAJI ROBE NA RATE BR.UG. {{ contract!.id }}</p>

        <p class="section-title">Ugovorne strane:</p>

        <p class="text">
          <strong>{{ PRODAVAC.naziv }}</strong>, {{ PRODAVAC.adresa }},
          PIB: {{ PRODAVAC.pib }}, mbr. {{ PRODAVAC.mbr }},
          koju zastupa {{ PRODAVAC.zastupnik }}, u daljem tekstu: <strong>PRODAVAC</strong>
        </p>
        <br>
        <p class="text">
          <strong>{{ customer!.firstName }} {{ customer!.lastName }}</strong>,
          JMBG: {{ customer!.jmbg || '______________________' }},
          iz {{ cityOf(customer!.address) }},
          ul. {{ customer!.address || '______________________________________' }},
          br.l.karte: {{ customer!.idCardNumber || '_____________' }}
          izdat od {{ customer!.issuingAuthority || '_____________' }},
          u daljem tekstu: <strong>KUPAC</strong>
        </p>

        <p class="article-title">Čl.1</p>
        <p class="text">PRODAVAC i KUPAC su postigli dogovor da Kupac može robu iz asortimana Prodavca kupiti na odloženo plaćanje bez kamate, na više mesečnih rata, a da će isplatu vršiti na način i u rokovima utvrđenim ovim Ugovorom.</p>

        <p class="article-title">Čl.2</p>
        <p class="text">
          Ugovorne strane saglasno konstatuju da je dana <strong>{{ fmtDate(contract!.contractDate) }}</strong> god.
          Kupac preuzeo robu u ukupnoj vrednosti od <strong>{{ fmt(contract!.contractAmount) }}</strong> dinara
          u prodavnici prodavca STR DUO {{ PRODAVAC.adresa }}.
          Kupac se obavezuje da isplatu iznosa iz predhodnog stava izvrši u
          <strong>{{ contract!.numberOfInstallments + 1 }}</strong> rata i to:
        </p>

        <p class="installment-line">
          <strong>Učešće</strong> u iznosu od <strong>{{ fmt(contract!.participation) }}</strong> dinara
          prilikom preuzimanja robe.
        </p>
        <p class="installment-line" *ngFor="let inst of contract!.installments">
          <strong>{{ inst.installmentOrdinal }}.</strong> ratu u iznosu od
          <strong>{{ fmt(inst.installmentAmount) }}</strong> din.,
          najkasnije do <strong>{{ fmtDate(inst.maturityDate) }}</strong>;
        </p>

        <p class="article-title">Čl.3</p>
        <p class="text">U slučaju da Kupac kasni sa isplatom bilo koje rate, ceo dug dospeva u celosti i Prodavac može pokrenuti postupak prinudne naplate, pri čemu se dug uvećava za iznos zakonske zatezne kamate od dana dospelosti do dana isplate. Kupac ne može preuzimati dodatnu robu i zaključivati novi Ugovor pre isplate duga po ovom Ugovoru.</p>

        <p class="article-title">Čl.4</p>
        <p class="text">Obe ugovorne strane se obavezuju da uredno vode evidenciju o isplati rata i stanju duga, kao i da svojim potpisom pored svake isplaćene rate (na samom ugovoru, na označenom mestu u čl.2), potvrde plaćanje i to tako da će Kupac potpisati primerak Prodavca, a Prodavac primerak Kupca.</p>

        <p class="article-title">Čl.5</p>
        <p class="text">Ovaj Ugovor sačinjen je u 2 (dva) istovetna primerka, po 1 (jedan) za svaku Ugovornu stranu.</p>

        <p class="article-title">Čl.6</p>
        <p class="text">Ugovor stupa na snagu danom zaključenja, a prestaje da važi isplatom ukupnog iznosa, kada će Prodavac izdati Kupcu konačni račun.</p>

        <div style="margin-top:48px;">
          <p class="text">U {{ PRODAVAC.grad }}, {{ fmtDate(contract!.contractDate) }}.</p>
        </div>

        <div class="signature-row">
          <div class="signature-block">
            <p>KUPAC</p>
            <div class="signature-line"></div>
            <p class="sig-name">{{ customer!.firstName }} {{ customer!.lastName }}</p>
          </div>
          <div class="signature-block">
            <p>PRODAVAC</p>
            <div class="signature-line"></div>
            <p class="sig-name">za STR DUO</p>
          </div>
        </div>
      </ng-template>

      <!-- ═══════════════ PRIMERAK 1 ═══════════════ -->
      <div class="page">
        <ng-container *ngTemplateOutlet="ugovorContent"></ng-container>
      </div>

      <!-- ═══════════════ PRIMERAK 2 ═══════════════ -->
      <div class="page page-break">
        <ng-container *ngTemplateOutlet="ugovorContent"></ng-container>
      </div>

      <!-- ═══════════════ PRILOG — Evidencija uplata ═══════════════ -->
      <div class="page page-break">
        <p class="title" style="font-size:14px;margin-bottom:16px;">
          PRILOG UZ UGOVOR BR. {{ contract.id }} — EVIDENCIJA UPLATA
        </p>
        <p class="text" style="margin-bottom:14px;">
          Kupac: <strong>{{ customer.firstName }} {{ customer.lastName }}</strong>
          &nbsp;|&nbsp; Iznos ugovora: <strong>{{ fmt(contract.contractAmount) }}</strong> din.
          &nbsp;|&nbsp; Učešće: <strong>{{ fmt(contract.participation) }}</strong> din.
          &nbsp;|&nbsp; Iznos finansiranja: <strong>{{ fmt(contract.financeAmount) }}</strong> din.
        </p>
        <table class="payment-table">
          <thead>
            <tr>
              <th>Br.</th>
              <th>Iznos rate (din.)</th>
              <th>Datum dospeća</th>
              <th>Uplaćeno (din.)</th>
              <th>Datum uplate</th>
              <th>Potpis kupca</th>
              <th>Potpis prodavca</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inst of contract.installments">
              <td style="text-align:center;">{{ inst.installmentOrdinal }}</td>
              <td style="text-align:right;">{{ fmt(inst.installmentAmount) }}</td>
              <td style="text-align:center;">{{ fmtDate(inst.maturityDate) }}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right;"><strong>UKUPNO:</strong></td>
              <td></td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
        <p class="text" style="margin-top:20px;font-size:10px;color:#555;">
          Napomena: Svaka uplaćena rata potvrđuje se potpisom obe ugovorne strane u kolonama "Potpis kupca" i "Potpis prodavca".
        </p>
      </div>

      <!-- ═══════════════ UPLATNICE ═══════════════ -->
      <div class="page page-break">
        <p class="title" style="font-size:13px;margin-bottom:12px;">
          UPLATNICE — Ugovor br. {{ contract.id }} — {{ customer.firstName }} {{ customer.lastName }}
        </p>

        <div class="uplatnica" *ngFor="let inst of contract.installments">

          <!-- ── Leva strana: Nalog za uplatu ── -->
          <div class="uplat-left">

            <div class="uplat-top">
              <!-- Platilac + svrha + primalac -->
              <div class="uplat-info">
                <div class="f-label">platilac</div>
                <div class="f-box">
                  {{ customer.firstName }} {{ customer.lastName }},
                  {{ customer.address }}
                </div>
                <div class="f-label" style="margin-top:4px;">svrha uplate</div>
                <div class="f-box">
                  Rata {{ inst.installmentOrdinal }} po ugovoru br. {{ contract.id }},
                  rok: {{ fmtDate(inst.maturityDate) }}
                </div>
                <div class="f-label" style="margin-top:4px;">primalac</div>
                <div class="f-box">STR DUO, {{ PRODAVAC.adresa }}</div>
              </div>

              <!-- Iznos + račun + QR + model -->
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
                    <div class="f-box-sm iznos-val">{{ fmt(inst.installmentAmount) }}</div>
                  </div>
                </div>
                <div class="f-label">račun primaoca</div>
                <div class="f-box racun">{{ PRODAVAC.racun }}</div>
                <div class="f-label" style="margin-top:4px;">model i poziv na broj</div>
                <div class="amounts-row" style="margin-top:2px;">
                  <div class="f-box-sm" style="width:36px;">97</div>
                  <div class="f-box-sm flex1">{{ pozivNaBroj(contract.id, inst.installmentOrdinal) }}</div>
                </div>
                <div class="qr-area">
                  <div class="qr-title">IPS QR KOD</div>
                  <img *ngIf="qrCodes.get(inst.id)" [src]="qrCodes.get(inst.id)" class="qr-img-large" alt="IPS QR" />
                  <span *ngIf="!qrCodes.get(inst.id)" class="qr-loading">QR</span>
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
                <div class="f-box-sm iznos-val">{{ fmt(inst.installmentAmount) }}</div>
              </div>
            </div>
            <div class="f-label">račun primaoca</div>
            <div class="f-box racun">{{ PRODAVAC.racun }}</div>
            <div class="f-label" style="margin-top:3px;">platilac</div>
            <div class="f-box">
              {{ customer.firstName }} {{ customer.lastName }},
              {{ customer.address }}
            </div>
            <div class="f-label" style="margin-top:3px;">model i poziv na broj</div>
            <div class="amounts-row" style="margin-top:2px;">
              <div class="f-box-sm" style="width:36px;">97</div>
              <div class="f-box-sm flex1">{{ pozivNaBroj(contract.id, inst.installmentOrdinal) }}</div>
            </div>
            <div class="f-label" style="margin-top:3px;">primalac</div>
            <div class="f-box">STR DUO, {{ PRODAVAC.adresa }}</div>
          </div><!-- /uplat-right -->

        </div><!-- /uplatnica -->
      </div><!-- /uplatnice page -->

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

    /* ── Stranica (A4) ── */
    .page {
      background: #fff;
      font-family: 'Times New Roman', Times, serif;
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      padding: 20mm 22mm 20mm 25mm;
      box-sizing: border-box;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }

    /* ── Ugovor tipografija ── */
    .title {
      font-size: 16px; font-weight: bold;
      text-align: center; margin-bottom: 24px;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 13px; font-weight: bold;
      margin: 0 0 8px; text-decoration: underline;
    }
    .article-title {
      font-size: 13px; font-weight: bold;
      text-align: center; margin: 24px 0 6px;
    }
    .text {
      font-size: 12px; line-height: 1.8;
      margin: 0 0 8px; text-align: justify;
    }
    .installment-line {
      font-size: 12px; line-height: 1.8; margin: 8px 0;
    }

    /* ── Potpisi ── */
    .signature-row {
      display: flex; justify-content: space-between; margin-top: 56px;
    }
    .signature-block {
      text-align: center; font-size: 12px;
      font-weight: bold; width: 220px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 200px; margin: 48px auto 8px;
    }
    .sig-name { font-size: 11px; font-weight: normal; margin: 0; }

    /* ── Prilog tabela ── */
    .payment-table {
      width: 100%; border-collapse: collapse;
      font-size: 11px; margin-top: 8px;
    }
    .payment-table th, .payment-table td {
      border: 1px solid #333; padding: 7px 8px;
    }
    .payment-table th {
      background: #f0f0f0; font-weight: bold; text-align: center;
    }
    .payment-table td { height: 30px; }
    .total-row td { background: #f7f7f7; border-top: 2px solid #333; }

    /* ── Uplatnica ── */
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

    /* ── Polja uplatnice ── */
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

    /* ── QR kod ── */
    .qr-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 4px;
    }

    .qr-title {
      font-size: 7.5px;
      font-weight: bold;
      color: #333;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-align: center;
    }

    .qr-img-large {
      width: 80%;
      max-width: 38mm;
      height: auto;
      display: block;
    }

    .qr-loading {
      font-size: 7px;
      color: #bbb;
    }

    /* ── Print ── */
    .page-break { page-break-before: always; }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      :host { background: #fff; }
      .no-print { display: none !important; }

      /*
        @page margin: 0 — padding kontrolišemo mi na .page
        width: 210mm = puna A4 širina; padding ostavlja prostor za margine štampača
      */
      .page {
        width: 210mm;
        box-sizing: border-box;
        margin: 0;
        padding: 14mm 28mm 14mm 30mm;
        box-shadow: none;
        min-height: auto;
      }

      .page-break { page-break-before: always; }

      /* Sprečiti prelivanje teksta van margina */
      .text, .installment-line, p {
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      /* Font na štampi */
      .title { font-size: 15px; margin-bottom: 14px; }
      .section-title { margin-bottom: 5px; }
      .article-title { margin: 14px 0 4px; font-size: 13px; }
      .text { font-size: 12px; line-height: 1.65; margin-bottom: 4px; }
      .installment-line { font-size: 12px; line-height: 1.55; margin: 3px 0; }

      /* Potpisi — sprečiti prelaz na sledeću stranu */
      .signature-row {
        margin-top: 24px;
        page-break-inside: avoid;
      }
      .signature-line { margin: 28px auto 5px; }

      .uplatnica { page-break-inside: avoid; }
    }
  `],
})
export class ContractPrintComponent implements OnInit {
  contract: ContractResponse | null = null;
  customer: UserResponse | null = null;
  qrCodes = new Map<number, string>();

  readonly PRODAVAC = PRODAVAC;
  readonly fmt = fmt;
  readonly fmtDate = fmtDate;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.contractService.getContractById(id).subscribe({
      next: contract => {
        this.contract = contract;
        this.userService.getCustomerById(contract.customerId).subscribe({
          next: customer => {
            this.customer = customer;
            this.generateQRCodes();
          }
        });
      }
    });
  }

  async generateQRCodes(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.contract || !this.customer) return;
    const qrcodeModule: any = await import('qrcode');
    const QRCode = qrcodeModule.default ?? qrcodeModule;
    for (const inst of this.contract.installments) {
      try {
        const qrData = this.buildIpsQr(inst);
        const url = await QRCode.toDataURL(qrData, { width: 250, margin: 1 });
        this.qrCodes.set(inst.id, url);
      } catch (e) {
        console.error('QR greška za ratu', inst.installmentOrdinal, e);
      }
    }
    this.cdr.detectChanges();
  }

  private mod97(value: string): number {
    if (!/^\d+$/.test(value)) {
      throw new Error('Vrednost za mod97 mora sadržati samo cifre.');
    }
    return [...value].reduce(
      (remainder, digit) => (remainder * 10 + Number(digit)) % 97,
      0
    );
  }

  pozivNaBroj(contractId: number, ordinal: number): string {
    const base = `${contractId}${String(ordinal).padStart(2, '0')}`;
    const remainder = this.mod97(`${base}00`);
    const controlNumber = String(98 - remainder).padStart(2, '0');
    return `${controlNumber}${base}`;
  }

  buildIpsQr(inst: InstallmentResponse): string {
    const amount = inst.installmentAmount.toFixed(2).replace('.', ',');
    const purpose = `Rata ${inst.installmentOrdinal} ug ${this.contract!.id}`;
    const referenceNumber = this.pozivNaBroj(this.contract!.id, inst.installmentOrdinal);
    return [
      'K:PR',
      'V:01',
      'C:1',
      `R:${PRODAVAC.racunIPS}`,
      `N:${PRODAVAC.nazivIPS}`,
      `I:RSD${amount}`,
      'SF:289',
      `S:${purpose}`,
      `RO:97${referenceNumber}`,
    ].join('|');
  }

  cityOf(address: string | undefined): string {
    if (!address) return '_______________';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address;
  }

  totalPaid(): number {
    return (this.contract?.installments ?? [])
      .reduce((sum, i) => sum + (i.paidAmount ?? 0), 0);
  }
}
