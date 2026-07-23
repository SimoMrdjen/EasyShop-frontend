import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';

import {
  BankStatementService, BankImportRow,
  BANK_TRANSACTION_STATUS_LABELS, BANK_TRANSACTION_STATUS_COLORS,
} from '../services/bank-statement.service';

@Component({
  selector: 'app-bank-statement-import',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    NzButtonModule, NzIconModule, NzTableModule, NzTagModule, NzUploadModule, NzCardModule,
  ],
  template: `
    <div style="padding: 24px; max-width: 960px;">
      <h2>Uvoz bankovnog izvoda</h2>
      <p style="color:#888; margin-bottom:16px;">
        Učitaj PDF izvod (Erste Bank ili Halkbank) - sistem će prepoznati uplate rata po pozivu na broj
        i predložiti ih za evidentiranje. Ništa se ne evidentira dok ne potvrdiš predložene stavke.
      </p>

      <nz-card>
        <nz-upload
          nzAccept=".pdf"
          [nzShowUploadList]="false"
          [nzBeforeUpload]="beforeUpload">
          <button nz-button nzType="primary" [nzLoading]="loading">
            <span nz-icon nzType="upload"></span> Učitaj izvod (PDF)
          </button>
        </nz-upload>
      </nz-card>

      <ng-container *ngIf="rows.length > 0">
        <nz-card style="margin-top:16px;">
          <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              Pronađeno <strong>{{ rows.length }}</strong> transakcija,
              <strong>{{ proposedCount() }}</strong> predloženo za evidentiranje.
            </div>
            <button nz-button nzType="primary" [disabled]="selectedIds.size === 0" [nzLoading]="confirming"
              (click)="confirmSelected()">
              <span nz-icon nzType="check"></span> Evidentiraj označene ({{ selectedIds.size }})
            </button>
          </div>

          <nz-table [nzData]="rows" nzBordered nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th style="width:40px;"></th>
                <th>Datum</th>
                <th>Iznos</th>
                <th>Ugovor</th>
                <th>Rata</th>
                <th>Kupac</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of rows">
                <td>
                  <input type="checkbox" *ngIf="row.status === 'PROPOSED_MATCH'"
                    [checked]="selectedIds.has(row.id)" (change)="toggle(row.id)" />
                </td>
                <td>{{ row.transactionDate | date:'dd.MM.yyyy' }}</td>
                <td>{{ row.amount | currency:'RSD':'symbol':'1.2-2' }}</td>
                <td>{{ row.contractId ?? '—' }}</td>
                <td>{{ row.installmentOrdinal ?? '—' }}</td>
                <td>{{ row.customerFullName ?? '—' }}</td>
                <td>
                  <nz-tag [nzColor]="statusColor(row.status)">{{ statusLabel(row.status) }}</nz-tag>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>
      </ng-container>
    </div>
  `,
})
export class BankStatementImportComponent {
  rows: BankImportRow[] = [];
  selectedIds = new Set<number>();
  loading = false;
  confirming = false;

  readonly statusLabel = (s: string) => BANK_TRANSACTION_STATUS_LABELS[s as keyof typeof BANK_TRANSACTION_STATUS_LABELS] ?? s;
  readonly statusColor = (s: string) => BANK_TRANSACTION_STATUS_COLORS[s as keyof typeof BANK_TRANSACTION_STATUS_COLORS] ?? 'default';

  constructor(
    private bankStatementService: BankStatementService,
    private notification: NzNotificationService,
  ) {}

  beforeUpload = (file: NzUploadFile): boolean => {
    this.loading = true;
    this.rows = [];
    this.selectedIds.clear();

    this.bankStatementService.preview(file as unknown as File).subscribe({
      next: rows => {
        this.rows = rows;
        this.selectedIds = new Set(rows.filter(r => r.status === 'PROPOSED_MATCH').map(r => r.id));
        this.loading = false;
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Nije moguće obraditi izvod');
        this.loading = false;
      }
    });

    return false; // sprecava nz-upload da sam salje fajl - mi to radimo rucno preko servisa
  };

  toggle(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  proposedCount(): number {
    return this.rows.filter(r => r.status === 'PROPOSED_MATCH').length;
  }

  confirmSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.confirming = true;
    this.bankStatementService.confirm([...this.selectedIds]).subscribe({
      next: updated => {
        const byId = new Map(updated.map(r => [r.id, r]));
        this.rows = this.rows.map(r => byId.get(r.id) ?? r);
        this.selectedIds.clear();
        this.notification.success('Uspešno', 'Uplate su evidentirane');
        this.confirming = false;
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Nije moguće evidentirati uplate');
        this.confirming = false;
      }
    });
  }
}
