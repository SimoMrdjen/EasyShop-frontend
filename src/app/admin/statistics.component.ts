import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { CollectionsService } from '../services/collections.service';
import { StatisticsOverview } from '../models/collections.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe,
    NzCardModule, NzTableModule, NzSpinModule, NzGridModule, NzToolTipModule,
  ],
  template: `
  <div style="padding: 24px; max-width: 1200px;">
    <h2>Statistika / pregled poslovanja</h2>

    <nz-spin [nzSpinning]="loading">
      <ng-container *ngIf="stats">

        <!-- Trenutno stanje -->
        <div nz-row [nzGutter]="16" style="margin-bottom: 24px;">
          <div nz-col [nzSpan]="6">
            <nz-card>
              <div style="color:#888; font-size:13px;">Ukupno neplaćenih rata</div>
              <div style="font-size:22px; font-weight:600;">{{ stats.totalUnpaidCount }}</div>
              <div style="color:#888;">{{ stats.totalUnpaidAmount | currency:'RSD':'symbol':'1.2-2' }}</div>
            </nz-card>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-card>
              <div style="color:#888; font-size:13px;">U kašnjenju</div>
              <div style="font-size:22px; font-weight:600; color:#fa8c16;">{{ stats.overdueCount }}</div>
              <div style="color:#888;">{{ stats.overdueAmount | currency:'RSD':'symbol':'1.2-2' }}</div>
            </nz-card>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-card>
              <div style="color:#888; font-size:13px;">Nije još dospelo</div>
              <div style="font-size:22px; font-weight:600; color:#1890ff;">{{ stats.notYetDueCount }}</div>
              <div style="color:#888;">{{ stats.notYetDueAmount | currency:'RSD':'symbol':'1.2-2' }}</div>
            </nz-card>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-card>
              <div style="color:#888; font-size:13px;">U utuženju (van evidencije)</div>
              <div style="font-size:22px; font-weight:600; color:#8c8c8c;">{{ stats.litigationContractsCount }}</div>
              <div style="color:#888;">{{ stats.litigationAmount | currency:'RSD':'symbol':'1.2-2' }}</div>
            </nz-card>
          </div>
        </div>

        <!-- Kašnjenje po starosti -->
        <nz-card nzTitle="Kašnjenje po starosti" style="margin-bottom: 24px;">
          <nz-table [nzData]="stats.overdueBuckets" [nzShowPagination]="false">
            <thead>
              <tr><th>Period</th><th>Broj rata</th><th>Iznos</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of stats.overdueBuckets">
                <td>{{ b.label }}</td>
                <td>{{ b.count }}</td>
                <td>{{ b.amount | currency:'RSD':'symbol':'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>

        <!-- Ocekivani priliv -->
        <nz-card nzTitle="Očekivani priliv (po periodima od 10 dana)">
          <div style="display:flex; align-items:flex-end; gap:8px; height:220px; margin-bottom:24px; padding:0 8px; overflow-x:auto;">
            <div *ngFor="let p of stats.expectedInflow" style="display:flex; flex-direction:column; align-items:center; min-width:70px;">
              <div style="font-size:12px; color:#333; margin-bottom:4px;">{{ p.amount | number:'1.0-0' }}</div>
              <div
                nz-tooltip
                [nzTooltipTitle]="p.label + ': ' + (p.amount | currency:'RSD':'symbol':'1.2-2') + ' (' + p.count + ' rata)'"
                style="width:36px; background:#1890ff; border-radius:4px 4px 0 0;"
                [style.height.px]="barHeight(p.amount)">
              </div>
              <div style="font-size:11px; color:#888; margin-top:6px; text-align:center; white-space:nowrap;">{{ p.label }}</div>
            </div>
          </div>

          <nz-table [nzData]="stats.expectedInflow" [nzShowPagination]="false" nzSize="small">
            <thead>
              <tr><th>Period</th><th>Broj rata</th><th>Očekivani iznos</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of stats.expectedInflow">
                <td>{{ p.label }}</td>
                <td>{{ p.count }}</td>
                <td>{{ p.amount | currency:'RSD':'symbol':'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>

      </ng-container>
    </nz-spin>
  </div>
  `,
})
export class StatisticsComponent implements OnInit {
  stats: StatisticsOverview | null = null;
  loading = false;

  constructor(
    private collectionsService: CollectionsService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.collectionsService.getStatisticsOverview(9).subscribe({
      next: (stats) => { this.stats = stats; this.loading = false; },
      error: () => {
        this.loading = false;
        this.notification.error('Greška', 'Nije moguće učitati statistiku');
      },
    });
  }

  barHeight(amount: number): number {
    if (!this.stats || this.stats.expectedInflow.length === 0) return 0;
    const max = Math.max(...this.stats.expectedInflow.map(p => p.amount), 1);
    const maxPx = 160;
    return Math.max(2, Math.round((amount / max) * maxPx));
  }
}
