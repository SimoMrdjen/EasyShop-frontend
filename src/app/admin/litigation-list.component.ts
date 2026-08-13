import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { ContractService } from '../services/contract.service';
import { ContractResponse } from '../models/contract.model';

@Component({
  selector: 'app-litigation-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, CurrencyPipe, DatePipe,
    NzTableModule, NzButtonModule, NzCardModule, NzEmptyModule, NzModalModule,
  ],
  template: `
  <div style="padding: 24px; max-width: 1100px;">
    <h2>Ugovori u utuženju</h2>
    <p style="color:#888;">
      Ugovori poslati kod advokata - ne pojavljuju se u dospelim ratama, pregledu za pozivanje ni SMS podsetnicima.
    </p>

    <nz-card>
      <nz-table [nzData]="contracts" [nzPageSize]="30" [nzLoading]="loading">
        <thead>
          <tr>
            <th>Ugovor</th>
            <th>Kupac</th>
            <th>Datum utuženja</th>
            <th>Beleška</th>
            <th>Preostali dug</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of contracts">
            <td><a [routerLink]="['/contracts', c.id]">#{{ c.id }}</a></td>
            <td>{{ c.customerFullName }}</td>
            <td>{{ c.litigationDate | date:'dd.MM.yyyy' }}</td>
            <td>{{ c.litigationNote || '—' }}</td>
            <td>{{ remainingForContract(c) | currency:'RSD':'symbol':'1.2-2' }}</td>
            <td><button nz-button nzType="link" (click)="confirmUnmark(c)">Poništi utuženje</button></td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loading && contracts.length === 0" nzNotFoundContent="Nema ugovora u utuženju"></nz-empty>
    </nz-card>
  </div>
  `,
})
export class LitigationListComponent implements OnInit {
  contracts: ContractResponse[] = [];
  loading = false;

  constructor(
    private contractService: ContractService,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.contractService.getLitigationContracts().subscribe({
      next: (contracts) => { this.contracts = contracts; this.loading = false; },
      error: () => {
        this.loading = false;
        this.notification.error('Greška', 'Nije moguće učitati listu');
      },
    });
  }

  remainingForContract(c: ContractResponse): number {
    return c.installments
      ? c.installments.reduce((sum, i) => sum + (i.installmentAmount - (i.paidAmount ?? 0)), 0)
      : 0;
  }

  confirmUnmark(c: ContractResponse): void {
    this.modal.confirm({
      nzTitle: 'Poništiti utuženje?',
      nzContent: `Ugovor #${c.id} će se ponovo pojaviti u dospelim ratama, pregledu za pozivanje i SMS podsetnicima.`,
      nzOkText: 'Poništi',
      nzOnOk: () => {
        this.contractService.unmarkLitigation(c.id).subscribe({
          next: () => {
            this.notification.success('Sačuvano', 'Utuženje je poništeno');
            this.load();
          },
          error: () => this.notification.error('Greška', 'Poništavanje nije uspelo'),
        });
      },
    });
  }
}
