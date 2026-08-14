import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { CustomerPickerComponent } from './customer-picker.component';
import { ContractService } from '../services/contract.service';
import { UserService } from '../services/user.service';
import { InstallmentResponse, PaymentMethod, PAYMENT_METHOD_LABELS, STATUS_COLORS, STATUS_LABELS } from '../models/contract.model';
import { UserResponse } from '../models/user.model';

@Component({
  selector: 'app-installments-overdue',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, RouterModule, ReactiveFormsModule,
    NzTableModule, NzTagModule, NzButtonModule, NzIconModule,
    NzModalModule, NzFormModule, NzInputNumberModule, NzSelectModule,
    NzDatePickerModule, NzAlertModule,
    CustomerPickerComponent,
  ],
  template: `
    <div style="padding: 24px;">

      <!-- Korak 1: odabir kupca -->
      <ng-container *ngIf="!selectedCustomer">
        <h2>Plaćanje rate — odaberite kupca</h2>
        <app-customer-picker (customerSelected)="onCustomerSelected($event)"></app-customer-picker>
      </ng-container>

      <!-- Korak 2: neplaćene rate odabranog kupca -->
      <ng-container *ngIf="selectedCustomer">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
          <button nz-button (click)="selectedCustomer = null; installments = []">
            <span nz-icon nzType="arrow-left"></span> Promeni kupca
          </button>
          <h2 style="margin:0;">
            Plaćanje rate — <strong>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</strong>
          </h2>
        </div>

        <nz-table [nzData]="installments" nzBordered [nzLoading]="loading" nzSize="middle">
          <thead>
            <tr>
              <th>Br. ugovora</th>
              <th>Br. rate</th>
              <th>Iznos rate</th>
              <th>Datum dospeća</th>
              <th>Status</th>
              <th>Plaćeno</th>
              <th>Ostatak</th>
              <th style="width:100px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let i of installments">
              <td style="text-align:center;">
                <a [routerLink]="['/contracts', i.contractId]">{{ i.contractId }}</a>
              </td>
              <td style="text-align:center;">{{ i.installmentOrdinal }}</td>
              <td>{{ i.installmentAmount | currency:'RSD':'symbol':'1.2-2' }}</td>
              <td style="color:#ff4d4f; font-weight:500;">{{ i.maturityDate | date:'dd.MM.yyyy' }}</td>
              <td><nz-tag [nzColor]="statusColor(i.status)">{{ statusLabel(i.status) }}</nz-tag></td>
              <td>{{ (i.paidAmount ?? 0) | currency:'RSD':'symbol':'1.2-2' }}</td>
              <td><strong style="color:#ff4d4f;">{{ (i.installmentAmount - (i.paidAmount ?? 0)) | currency:'RSD':'symbol':'1.2-2' }}</strong></td>
              <td>
                <button nz-button nzType="primary" nzSize="small" (click)="openPayModal(i)">
                  Uplati
                </button>
              </td>
            </tr>
            <tr *ngIf="!loading && installments.length === 0">
              <td colspan="8" style="text-align:center; color:#888;">
                Nema dospelih neplaćenih rata za ovog kupca
              </td>
            </tr>
          </tbody>
        </nz-table>
      </ng-container>

    </div>

    <!-- Modal za plaćanje -->
    <nz-modal
      [(nzVisible)]="payModalVisible"
      nzTitle="Uplata rate br. {{ selectedInstallment?.installmentOrdinal }}"
      (nzOnCancel)="closePayModal()"
      (nzOnOk)="confirmPay()"
      [nzOkLoading]="paying"
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
  `,
})
export class InstallmentsOverdueComponent implements OnInit {
  selectedCustomer: UserResponse | null = null;
  installments: InstallmentResponse[] = [];
  loading = false;

  payModalVisible = false;
  paying = false;
  selectedInstallment: InstallmentResponse | null = null;
  selectedInstallmentIsLast = false;
  payForm: FormGroup;

  readonly statusLabel = (s: string) => STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s;
  readonly statusColor = (s: string) => STATUS_COLORS[s as keyof typeof STATUS_COLORS] ?? 'default';
  readonly methodLabel = (m: string) => PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m;

  constructor(
    private contractService: ContractService,
    private userService: UserService,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.payForm = this.fb.group({
      paidAmount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: ['GOTOVINA', Validators.required],
    });
  }

  ngOnInit(): void {
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    if (customerId) {
      this.userService.getCustomerById(Number(customerId)).subscribe({
        next: customer => this.onCustomerSelected(customer)
      });
    }
  }

  onCustomerSelected(customer: UserResponse): void {
    this.selectedCustomer = customer;
    this.loading = true;
    this.contractService.getUnpaidByCustomer(customer.profileId).subscribe({
      next: res => { this.installments = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openPayModal(inst: InstallmentResponse): void {
    this.selectedInstallment = inst;
    this.selectedInstallmentIsLast = false;
    const remaining = inst.installmentAmount - (inst.paidAmount ?? 0);
    this.payForm.reset({ paidAmount: remaining, paymentDate: new Date(), paymentMethod: 'GOTOVINA' });
    this.payModalVisible = true;

    this.contractService.getContractById(inst.contractId).subscribe({
      next: contract => {
        this.selectedInstallmentIsLast = inst.installmentOrdinal === contract.numberOfInstallments;
      }
    });
  }

  remainingForSelected(): number {
    if (!this.selectedInstallment) return 0;
    return this.selectedInstallment.installmentAmount - (this.selectedInstallment.paidAmount ?? 0);
  }

  showOverpayWarning(): boolean {
    const entered = this.payForm.value.paidAmount;
    if (entered == null || !this.selectedInstallmentIsLast) return false;
    return entered > this.remainingForSelected() + 0.001;
  }

  closePayModal(): void {
    this.payModalVisible = false;
    this.selectedInstallment = null;
  }

  confirmPay(): void {
    if (this.payForm.invalid || !this.selectedInstallment || !this.selectedCustomer) return;
    this.paying = true;
    const val = this.payForm.value;
    const date: Date = val.paymentDate;
    const installmentId = this.selectedInstallment.id;
    const contractId = this.selectedInstallment.contractId;

    this.contractService.payInstallment(installmentId, {
      paidAmount: val.paidAmount,
      paymentMethod: val.paymentMethod,
      paymentDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    }).subscribe({
      next: () => {
        this.notification.success('Uspešno', 'Uplata je evidentirana');
        this.closePayModal();
        this.paying = false;
        // Aplikacija radi u jednom prozoru (Chrome app-mode) - navigiramo direktno na priznanicu
        this.router.navigate(['/contracts', contractId, 'installments', installmentId, 'receipt']);
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Greška pri evidentiranju uplate');
        this.paying = false;
      }
    });
  }
}
