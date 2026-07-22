import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { CustomerPickerComponent } from './customer-picker.component';
import { ContractService } from '../services/contract.service';
import { UserService } from '../services/user.service';
import { UserResponse } from '../models/user.model';

@Component({
  selector: 'app-contract-new',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    NzFormModule, NzInputNumberModule, NzButtonModule,
    NzCardModule, NzDatePickerModule, NzDividerModule,
    CustomerPickerComponent,
  ],
  template: `
    <div style="padding: 24px;">

      <!-- Korak 1: odabir kupca -->
      <ng-container *ngIf="!selectedCustomer">
        <h2>Novi ugovor — odaberite kupca</h2>
        <app-customer-picker (customerSelected)="onCustomerSelected($event)"></app-customer-picker>
      </ng-container>

      <!-- Korak 2: forma -->
      <ng-container *ngIf="selectedCustomer">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
          <button nz-button (click)="selectedCustomer = null">
            <span nz-icon nzType="arrow-left"></span> Promeni kupca
          </button>
          <h2 style="margin:0;">
            Novi ugovor — <strong>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</strong>
          </h2>
        </div>

        <nz-card style="max-width: 640px;">
          <form nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired>Iznos ugovora (RSD)</nz-form-label>
                  <nz-form-control nzErrorTip="Unesite iznos">
                    <nz-input-number formControlName="contractAmount" [nzMin]="1" [nzStep]="1000"
                      style="width:100%;" nzPlaceHolder="npr. 120000"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired>Učešće (RSD)</nz-form-label>
                  <nz-form-control nzErrorTip="Unesite učešće">
                    <nz-input-number formControlName="participation" [nzMin]="0" [nzStep]="1000"
                      style="width:100%;" nzPlaceHolder="npr. 20000"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired>Broj rata</nz-form-label>
                  <nz-form-control nzErrorTip="Unesite broj rata">
                    <nz-input-number formControlName="numberOfInstallments" [nzMin]="1" [nzMax]="120"
                      style="width:100%;"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired>Datum ugovora</nz-form-label>
                  <nz-form-control nzErrorTip="Unesite datum">
                    <nz-date-picker formControlName="contractDate" nzFormat="dd.MM.yyyy"
                      style="width:100%;"></nz-date-picker>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div *ngIf="financeAmount > 0"
              style="background:#f0f9eb; border:1px solid #b7eb8f; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
              <div>Iznos finansiranja: <strong>{{ financeAmount | number:'1.2-2' }} RSD</strong></div>
              <div *ngIf="monthlyAmount > 0">
                Mesečna rata: <strong style="font-size:16px; color:#52c41a;">{{ monthlyAmount | number:'1.2-2' }} RSD</strong>
              </div>
            </div>

            <nz-form-item>
              <nz-form-control>
                <button nz-button nzType="primary" [nzLoading]="saving">Kreiraj ugovor</button>
                <button nz-button type="button" routerLink="/contracts" style="margin-left:8px;">Odustani</button>
              </nz-form-control>
            </nz-form-item>
          </form>
        </nz-card>
      </ng-container>

    </div>
  `,
})
export class ContractNewComponent implements OnInit {
  selectedCustomer: UserResponse | null = null;
  form: FormGroup;
  saving = false;

  get financeAmount(): number {
    const { contractAmount, participation } = this.form.value;
    return (contractAmount ?? 0) - (participation ?? 0);
  }

  get monthlyAmount(): number {
    const n = this.form.value.numberOfInstallments ?? 0;
    return n > 0 ? Math.round((this.financeAmount / n) * 100) / 100 : 0;
  }

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService,
    private userService: UserService,
    private notification: NzNotificationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      contractAmount: [null, [Validators.required, Validators.min(1)]],
      participation: [0, [Validators.required, Validators.min(0)]],
      numberOfInstallments: [3, [Validators.required, Validators.min(1)]],
      contractDate: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    // Ako je prosleđen customerId (iz liste ugovora), učitaj kupca
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    if (customerId) {
      this.userService.getCustomerById(Number(customerId)).subscribe({
        next: customer => { this.selectedCustomer = customer; }
      });
    }
  }

  onCustomerSelected(customer: UserResponse): void {
    this.selectedCustomer = customer;
  }

  submit(): void {
    if (this.form.invalid || !this.selectedCustomer) return;
    if (this.financeAmount <= 0) {
      this.notification.error('Greška', 'Učešće mora biti manje od iznosa ugovora');
      return;
    }

    this.saving = true;
    const val = this.form.value;
    const date: Date = val.contractDate;

    this.contractService.createContract({
      customerId: this.selectedCustomer.profileId,
      contractAmount: val.contractAmount,
      participation: val.participation,
      numberOfInstallments: val.numberOfInstallments,
      contractDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    }).subscribe({
      next: res => {
        this.notification.success('Uspešno', 'Ugovor je kreiran');
        this.router.navigate(['/contracts', res.id]);
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Greška pri kreiranju ugovora');
        this.saving = false;
      }
    });
  }
}
