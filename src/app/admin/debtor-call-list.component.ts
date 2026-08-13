import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { CollectionsService } from '../services/collections.service';
import { DebtorCallListEntry } from '../models/collections.model';

@Component({
  selector: 'app-debtor-call-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, CurrencyPipe, DatePipe,
    NzTableModule, NzButtonModule, NzFormModule, NzInputNumberModule,
    NzIconModule, NzCardModule, NzEmptyModule, NzTagModule,
  ],
  template: `
  <div style="padding: 24px; max-width: 1100px;">
    <h2>Pregled za pozivanje dužnika</h2>
    <p style="color:#888;">
      Rate koje kasne u zadatom opsegu dana, isključujući ugovore poslate na utuženje.
    </p>

    <nz-card style="margin-bottom: 24px;">
      <form nz-form nzLayout="inline" (ngSubmit)="search()">
        <nz-form-item>
          <nz-form-label>Kašnjenje od (dana)</nz-form-label>
          <nz-form-control>
            <nz-input-number [(ngModel)]="fromDays" name="fromDays" [nzMin]="0" style="width: 110px;"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>do (dana)</nz-form-label>
          <nz-form-control>
            <nz-input-number [(ngModel)]="toDays" name="toDays" [nzMin]="0" style="width: 110px;"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>Min. iznos duga</nz-form-label>
          <nz-form-control>
            <nz-input-number [(ngModel)]="minAmount" name="minAmount" [nzMin]="0" style="width: 130px;"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
        <button nz-button nzType="primary" type="submit" [nzLoading]="loading">
          <span nz-icon nzType="search"></span> Pretraži
        </button>
      </form>
    </nz-card>

    <nz-card>
      <div style="margin-bottom:12px; color:#888;" *ngIf="entries.length > 0">
        Pronađeno: {{ entries.length }} rata
      </div>
      <nz-table [nzData]="entries" [nzPageSize]="30" [nzLoading]="loading">
        <thead>
          <tr>
            <th>Kupac</th>
            <th>Telefon</th>
            <th>Ugovor / rata</th>
            <th>Datum dospeća</th>
            <th>Dana kašnjenja</th>
            <th>Preostali iznos</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of entries">
            <td>{{ e.customerFullName }}</td>
            <td>{{ e.phoneNumber || '—' }}</td>
            <td><a [routerLink]="['/contracts', e.contractId]">#{{ e.contractId }}</a> / rata {{ e.installmentOrdinal }}</td>
            <td>{{ e.maturityDate | date:'dd.MM.yyyy' }}</td>
            <td><nz-tag nzColor="orange">{{ e.daysOverdue }}</nz-tag></td>
            <td><strong>{{ e.remainingAmount | currency:'RSD':'symbol':'1.2-2' }}</strong></td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loading && entries.length === 0" nzNotFoundContent="Nema rata koje odgovaraju kriterijumu"></nz-empty>
    </nz-card>
  </div>
  `,
})
export class DebtorCallListComponent implements OnInit {
  fromDays = 0;
  toDays = 45;
  minAmount: number | null = null;
  entries: DebtorCallListEntry[] = [];
  loading = false;

  constructor(
    private collectionsService: CollectionsService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.loading = true;
    this.collectionsService.getDebtorCallList(this.fromDays, this.toDays, this.minAmount).subscribe({
      next: (entries) => { this.entries = entries; this.loading = false; },
      error: () => {
        this.loading = false;
        this.notification.error('Greška', 'Nije moguće učitati pregled');
      },
    });
  }
}
