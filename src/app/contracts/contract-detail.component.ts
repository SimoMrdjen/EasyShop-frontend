import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { ContractService } from '../services/contract.service';
import { ContractResponse, InstallmentResponse, PaymentMethod, PAYMENT_METHOD_LABELS, STATUS_COLORS, STATUS_LABELS } from '../models/contract.model';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    NzTableModule, NzTagModule, NzButtonModule, NzIconModule,
    NzCardModule, NzDescriptionsModule, NzModalModule,
    NzFormModule, NzInputNumberModule, NzSelectModule,
    NzDatePickerModule, NzDividerModule, NzAlertModule, NzInputModule, CurrencyPipe, DatePipe,
  ],
  template: `
    <div style="padding: 24px;">
      <div style="margin-bottom:16px; display:flex; gap:8px;">
        <button nz-button routerLink="/contracts">
          <span nz-icon nzType="arrow-left"></span> Nazad
        </button>
        <button nz-button nzType="default" [routerLink]="['/contracts', contract?.id, 'print']" *ngIf="contract">
          <span nz-icon nzType="printer"></span> Štampaj ugovor
        </button>
        <button *ngIf="isAdmin && contract && !contract.sentToLitigation" nz-button nzDanger
          (click)="openLitigationModal()">
          <span nz-icon nzType="bank"></span> Pošalji na utuženje
        </button>
        <button *ngIf="isAdmin && contract?.sentToLitigation" nz-button (click)="confirmUnmarkLitigation()">
          Poništi utuženje
        </button>
      </div>

      <nz-alert *ngIf="contract?.sentToLitigation" nzType="warning" nzShowIcon style="margin-bottom:16px;"
        nzMessage="Ugovor je poslat na utuženje"
        [nzDescription]="'Datum: ' + (contract!.litigationDate | date:'dd.MM.yyyy') + (contract!.litigationNote ? (' — ' + contract!.litigationNote) : '')">
      </nz-alert>

      <ng-container *ngIf="contract">
        <!-- Podaci o ugovoru -->
        <nz-card nzTitle="Ugovor br. {{ contract.id }}" style="margin-bottom:24px;">
          <nz-descriptions nzBordered nzSize="small" [nzColumn]="3">
            <nz-descriptions-item nzTitle="Kupac">{{ contract.customerFullName }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Datum ugovora">{{ contract.contractDate | date:'dd.MM.yyyy' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Broj rata">{{ contract.numberOfInstallments }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Iznos ugovora">{{ contract.contractAmount | currency:'RSD':'symbol':'1.2-2' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Učešće">{{ contract.participation | currency:'RSD':'symbol':'1.2-2' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Iznos finansiranja">{{ contract.financeAmount | currency:'RSD':'symbol':'1.2-2' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Mesečna rata" [nzSpan]="3">
              <strong>{{ contract.installmentAmount | currency:'RSD':'symbol':'1.2-2' }}</strong>
            </nz-descriptions-item>
          </nz-descriptions>
        </nz-card>

        <!-- Tabela rata -->
        <nz-card nzTitle="Rate">
          <nz-table [nzData]="contract.installments" nzBordered nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th style="width:60px;">Br.</th>
                <th>Iznos rate</th>
                <th>Datum dospeća</th>
                <th>Status</th>
                <th>Plaćeno</th>
                <th>Datum plaćanja</th>
                <th>Način plaćanja</th>
                <th style="width:100px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inst of contract.installments">
                <td style="text-align:center;">{{ inst.installmentOrdinal }}</td>
                <td>{{ inst.installmentAmount | currency:'RSD':'symbol':'1.2-2' }}</td>
                <td>{{ inst.maturityDate | date:'dd.MM.yyyy' }}</td>
                <td>
                  <nz-tag [nzColor]="statusColor(inst.status)">{{ statusLabel(inst.status) }}</nz-tag>
                </td>
                <td>{{ inst.paidAmount != null ? (inst.paidAmount | currency:'RSD':'symbol':'1.2-2') : '—' }}</td>
                <td>{{ inst.paymentDate ? (inst.paymentDate | date:'dd.MM.yyyy') : '—' }}</td>
                <td>{{ inst.paymentMethod ? methodLabel(inst.paymentMethod) : '—' }}</td>
                <td>
                  <button *ngIf="inst.status !== 'PAID'" nz-button nzType="primary" nzSize="small"
                    (click)="openPayModal(inst)">
                    Uplati
                  </button>
                  <button *ngIf="inst.status === 'PAID'" nz-button nzType="default" nzSize="small"
                    (click)="printReceipt(inst)">
                    <span nz-icon nzType="printer"></span> Priznanica
                  </button>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>
      </ng-container>
    </div>

    <!-- Modal za plaćanje -->
    <nz-modal [(nzVisible)]="payModalVisible" nzTitle="Uplata rate br. {{ selectedInstallment?.installmentOrdinal }}"
      (nzOnCancel)="closePayModal()" (nzOnOk)="confirmPay()" [nzOkLoading]="paying"
      nzOkText="Potvrdi uplatu">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="payForm" nzLayout="vertical">
          <nz-alert *ngIf="showOverpayWarning()" nzType="warning" nzShowIcon
            style="margin-bottom:16px;"
            nzMessage="Ovo je poslednja rata po ugovoru. Iznos preko preostalog duga ({{ remainingForSelected() | currency:'RSD':'symbol':'1.2-2' }}) neće biti nigde evidentiran - proverite iznos pre potvrde.">
          </nz-alert>
          <nz-form-item>
            <nz-form-label nzRequired>Iznos uplate (RSD)</nz-form-label>
            <nz-form-control nzErrorTip="Unesite iznos">
              <nz-input-number formControlName="paidAmount" [nzMin]="0.01" style="width:100%;"></nz-input-number>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label nzRequired>Datum uplate</nz-form-label>
            <nz-form-control nzErrorTip="Unesite datum">
              <nz-date-picker formControlName="paymentDate" nzFormat="dd.MM.yyyy" style="width:100%;"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label nzRequired>Način plaćanja</nz-form-label>
            <nz-form-control nzErrorTip="Odaberite način plaćanja">
              <nz-select formControlName="paymentMethod" style="width:100%;">
                <nz-option nzValue="GOTOVINA" nzLabel="Gotovina"></nz-option>
                <nz-option nzValue="UPLATA_TR" nzLabel="Uplata na TR"></nz-option>
                <nz-option nzValue="KARTICA" nzLabel="Kartica"></nz-option>
                <nz-option nzValue="CHECK" nzLabel="Ček"></nz-option>
                <nz-option nzValue="DRUGO" nzLabel="Drugo"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>

    <!-- Modal za utuženje -->
    <nz-modal [(nzVisible)]="litigationModalVisible" nzTitle="Pošalji ugovor na utuženje"
      (nzOnCancel)="litigationModalVisible = false" (nzOnOk)="confirmMarkLitigation()"
      [nzOkLoading]="markingLitigation" nzOkText="Pošalji" nzOkDanger>
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="litigationForm" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Datum</nz-form-label>
            <nz-form-control nzErrorTip="Unesite datum">
              <nz-date-picker formControlName="date" nzFormat="dd.MM.yyyy" style="width:100%;"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Beleška (broj predmeta, advokat, i sl.)</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="note" rows="3"></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `,
})
export class ContractDetailComponent implements OnInit {
  contract: ContractResponse | null = null;
  loading = false;
  isAdmin = false;

  payModalVisible = false;
  paying = false;
  selectedInstallment: InstallmentResponse | null = null;
  payForm: FormGroup;

  litigationModalVisible = false;
  markingLitigation = false;
  litigationForm: FormGroup;

  readonly statusLabel = (s: string) => STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s;
  readonly statusColor = (s: string) => STATUS_COLORS[s as keyof typeof STATUS_COLORS] ?? 'default';
  readonly methodLabel = (m: string) => PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: ContractService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private fb: FormBuilder,
  ) {
    this.payForm = this.fb.group({
      paidAmount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: ['GOTOVINA', Validators.required],
    });
    this.litigationForm = this.fb.group({
      date: [new Date(), Validators.required],
      note: [''],
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isAdmin = window.localStorage.getItem('role') === 'ADMIN';
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.contractService.getContractById(id).subscribe({
      next: res => { this.contract = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openLitigationModal(): void {
    this.litigationForm.reset({ date: new Date(), note: '' });
    this.litigationModalVisible = true;
  }

  confirmMarkLitigation(): void {
    if (this.litigationForm.invalid || !this.contract) return;
    this.markingLitigation = true;
    const date: Date = this.litigationForm.value.date;
    this.contractService.markSentToLitigation(this.contract.id, {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      note: this.litigationForm.value.note || undefined,
    }).subscribe({
      next: (updated) => {
        this.contract = updated;
        this.markingLitigation = false;
        this.litigationModalVisible = false;
        this.notification.success('Sačuvano', 'Ugovor je označen kao poslat na utuženje');
      },
      error: () => {
        this.markingLitigation = false;
        this.notification.error('Greška', 'Označavanje nije uspelo');
      },
    });
  }

  confirmUnmarkLitigation(): void {
    if (!this.contract) return;
    this.modal.confirm({
      nzTitle: 'Poništiti utuženje?',
      nzContent: 'Ugovor će se ponovo pojaviti u dospelim ratama, pregledu za pozivanje i SMS podsetnicima.',
      nzOkText: 'Poništi',
      nzOnOk: () => {
        this.contractService.unmarkLitigation(this.contract!.id).subscribe({
          next: (updated) => {
            this.contract = updated;
            this.notification.success('Sačuvano', 'Utuženje je poništeno');
          },
          error: () => this.notification.error('Greška', 'Poništavanje nije uspelo'),
        });
      },
    });
  }

  openPayModal(inst: InstallmentResponse): void {
    this.selectedInstallment = inst;
    const remaining = inst.installmentAmount - (inst.paidAmount ?? 0);
    this.payForm.reset({ paidAmount: remaining, paymentDate: new Date(), paymentMethod: 'GOTOVINA' });
    this.payModalVisible = true;
  }

  remainingForSelected(): number {
    if (!this.selectedInstallment) return 0;
    return this.selectedInstallment.installmentAmount - (this.selectedInstallment.paidAmount ?? 0);
  }

  showOverpayWarning(): boolean {
    if (!this.selectedInstallment || !this.contract) return false;
    const isLast = this.selectedInstallment.installmentOrdinal === this.contract.numberOfInstallments;
    const entered = this.payForm.value.paidAmount;
    if (entered == null || !isLast) return false;
    return entered > this.remainingForSelected() + 0.001;
  }

  closePayModal(): void {
    this.payModalVisible = false;
    this.selectedInstallment = null;
  }

  confirmPay(): void {
    if (this.payForm.invalid || !this.selectedInstallment) return;
    this.paying = true;
    const val = this.payForm.value;
    const date: Date = val.paymentDate;

    const installmentId = this.selectedInstallment.id;

    this.contractService.payInstallment(installmentId, {
      paidAmount: val.paidAmount,
      paymentMethod: val.paymentMethod,
      paymentDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    }).subscribe({
      next: () => {
        this.notification.success('Uspešno', 'Uplata je evidentirana');
        this.closePayModal();
        this.paying = false;
        // Aplikacija radi u jednom prozoru (Chrome app-mode) gde window.open()
        // za novi tab/prozor nije pouzdan, pa se na priznanicu navigira direktno.
        this.openReceipt(installmentId);
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Greška pri evidentiranju uplate');
        this.paying = false;
      }
    });
  }

  printReceipt(inst: InstallmentResponse): void {
    this.openReceipt(inst.id);
  }

  private openReceipt(installmentId: number): void {
    this.router.navigate(['/contracts', this.contract!.id, 'installments', installmentId, 'receipt']);
  }
}
