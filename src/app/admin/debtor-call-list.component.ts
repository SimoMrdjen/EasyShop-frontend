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
import { DebtorCallGroup } from '../models/collections.model';

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
    <div class="no-print">
      <h2>Pregled za pozivanje dužnika</h2>
      <p style="color:#888;">
        Rate koje kasne u zadatom opsegu dana, grupisane po kupcu (isti kupac se pojavljuje samo jednom),
        isključujući ugovore poslate na utuženje.
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
          <button nz-button type="button" (click)="print()" style="margin-left:8px;" [disabled]="groups.length === 0">
            <span nz-icon nzType="printer"></span> Štampaj
          </button>
        </form>
      </nz-card>
    </div>

    <div class="print-header" style="display:none;">
      <h2>Pregled za pozivanje dužnika</h2>
      <div>Kašnjenje: {{ fromDays }}-{{ toDays }} dana{{ minAmount ? (', min. iznos: ' + minAmount + ' din.') : '' }}</div>
      <div>Datum štampe: {{ today | date:'dd.MM.yyyy' }}</div>
    </div>

    <nz-card class="no-print" *ngIf="groups.length > 0" style="margin-bottom:12px;">
      <span style="color:#888;">Pronađeno: {{ groups.length }} kupaca, {{ totalInstallments() }} rata</span>
    </nz-card>

    <nz-card>
      <nz-table [nzData]="groups" [nzShowPagination]="false" [nzLoading]="loading" class="print-table">
        <thead>
          <tr>
            <th>Kupac</th>
            <th>Telefon</th>
            <th>Rate</th>
            <th>Ukupno</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let g of groups">
            <td>{{ g.customerFullName }}</td>
            <td>{{ g.phoneNumber || '—' }}</td>
            <td>
              <div *ngFor="let inst of g.installments" style="margin-bottom:2px;">
                <a class="no-print" [routerLink]="['/contracts', inst.contractId]">#{{ inst.contractId }}</a>
                <span class="print-only">#{{ inst.contractId }}</span>
                / rata {{ inst.installmentOrdinal }} —
                {{ inst.maturityDate | date:'dd.MM.yyyy' }} —
                <nz-tag nzColor="orange" class="no-print">{{ inst.daysOverdue }} dana</nz-tag>
                <span class="print-only">{{ inst.daysOverdue }} dana</span>
                — {{ inst.remainingAmount | currency:'RSD':'symbol':'1.2-2' }}
              </div>
            </td>
            <td><strong>{{ g.totalRemainingAmount | currency:'RSD':'symbol':'1.2-2' }}</strong></td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loading && groups.length === 0" nzNotFoundContent="Nema kupaca koji odgovaraju kriterijumu"></nz-empty>
    </nz-card>
  </div>
  `,
  styles: [`
    .print-only { display: none; }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: inline !important; }
      .print-header { display: block !important; margin-bottom: 16px; }
      ::ng-deep .ant-table-pagination { display: none !important; }
    }
  `],
})
export class DebtorCallListComponent implements OnInit {
  fromDays = 0;
  toDays = 45;
  minAmount: number | null = null;
  groups: DebtorCallGroup[] = [];
  loading = false;
  today = new Date();

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
      next: (groups) => { this.groups = groups; this.loading = false; },
      error: () => {
        this.loading = false;
        this.notification.error('Greška', 'Nije moguće učitati pregled');
      },
    });
  }

  totalInstallments(): number {
    return this.groups.reduce((sum, g) => sum + g.installments.length, 0);
  }

  print(): void {
    window.print();
  }
}
