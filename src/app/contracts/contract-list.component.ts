import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';

import { CustomerPickerComponent } from './customer-picker.component';
import { ContractService } from '../services/contract.service';
import { ContractResponse } from '../models/contract.model';
import { UserResponse } from '../models/user.model';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, CurrencyPipe, DatePipe,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule, NzCardModule,
    CustomerPickerComponent,
  ],
  template: `
    <div style="padding: 24px;">

      <!-- Korak 1: odabir kupca -->
      <ng-container *ngIf="!selectedCustomer">
        <h2>Ugovori — odaberite kupca</h2>
        <app-customer-picker (customerSelected)="onCustomerSelected($event)"></app-customer-picker>
      </ng-container>

      <!-- Korak 2: ugovori odabranog kupca -->
      <ng-container *ngIf="selectedCustomer">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
          <button nz-button (click)="selectedCustomer = null; contracts = []">
            <span nz-icon nzType="arrow-left"></span> Promeni kupca
          </button>
          <h2 style="margin:0;">
            Ugovori — <strong>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</strong>
          </h2>
          <button nz-button nzType="primary" style="margin-left:auto;"
            [routerLink]="['/contracts/new']" [queryParams]="{customerId: selectedCustomer.profileId}">
            <span nz-icon nzType="plus"></span> Novi ugovor
          </button>
        </div>

        <nz-table [nzData]="contracts" nzBordered [nzLoading]="loading" nzSize="middle">
          <thead>
            <tr>
              <th>Br.</th>
              <th>Iznos ugovora</th>
              <th>Učešće</th>
              <th>Iznos finansiranja</th>
              <th>Br. rata</th>
              <th>Mesečna rata</th>
              <th>Datum ugovora</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of contracts">
              <td>{{ c.id }}</td>
              <td>{{ c.contractAmount | currency:'RSD':'symbol':'1.2-2' }}</td>
              <td>{{ c.participation | currency:'RSD':'symbol':'1.2-2' }}</td>
              <td>{{ c.financeAmount | currency:'RSD':'symbol':'1.2-2' }}</td>
              <td style="text-align:center;">{{ c.numberOfInstallments }}</td>
              <td>{{ c.installmentAmount | currency:'RSD':'symbol':'1.2-2' }}</td>
              <td>{{ c.contractDate | date:'dd.MM.yyyy' }}</td>
              <td>
                <button nz-button nzSize="small" [routerLink]="['/contracts', c.id]">
                  <span nz-icon nzType="eye"></span> Detalji
                </button>
              </td>
            </tr>
            <tr *ngIf="!loading && contracts.length === 0">
              <td colspan="8" style="text-align:center; color:#888;">
                Kupac nema ugovora
              </td>
            </tr>
          </tbody>
        </nz-table>
      </ng-container>

    </div>
  `,
})
export class ContractListComponent {
  selectedCustomer: UserResponse | null = null;
  contracts: ContractResponse[] = [];
  loading = false;

  constructor(private contractService: ContractService) {}

  onCustomerSelected(customer: UserResponse): void {
    this.selectedCustomer = customer;
    this.loading = true;
    this.contractService.getContractsByCustomer(customer.profileId).subscribe({
      next: res => { this.contracts = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
