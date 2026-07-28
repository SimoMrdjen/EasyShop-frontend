import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { UserService } from '../services/user.service';
import { UserResponse } from '../models/user.model';

@Component({
  selector: 'app-customer-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzInputModule, NzFormModule, NzIconModule, NzButtonModule],
  template: `
    <div>
      <nz-form-item style="max-width:420px; margin-bottom:16px;">
        <nz-form-control>
          <nz-input-group nzCompact style="display:flex;">
            <input nz-input placeholder="Unesi prezime kupca..." [(ngModel)]="searchTerm"
              (keyup.enter)="search()" style="flex:1;" />
            <button nz-button nzType="primary" (click)="search()" [nzLoading]="loading">
              <span nz-icon nzType="search"></span> Pretraži
            </button>
          </nz-input-group>
        </nz-form-control>
      </nz-form-item>

      <nz-table [nzData]="customers" nzBordered [nzLoading]="loading" nzSize="middle"
        [nzNoResult]="searched ? 'Nema rezultata pretrage' : 'Unesi prezime kupca i klikni Pretraži'">
        <thead>
          <tr>
            <th>Ime i prezime</th>
            <th>Email</th>
            <th>Telefon</th>
            <th>JMBG</th>
            <th>Adresa</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of customers" class="customer-row" (click)="select(c)">
            <td><strong>{{ c.firstName }} {{ c.lastName }}</strong></td>
            <td>{{ c.username }}</td>
            <td>{{ c.phoneNumber }}</td>
            <td>{{ c.jmbg }}</td>
            <td>{{ c.address }}</td>
            <td>
              <button nz-button nzType="primary" nzSize="small" (click)="$event.stopPropagation(); select(c)">
                Odaberi
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [`
    .customer-row { cursor: pointer; }
    .customer-row:hover td { background: #e6f4ff; }
  `]
})
export class CustomerPickerComponent {
  @Output() customerSelected = new EventEmitter<UserResponse>();

  customers: UserResponse[] = [];
  loading = false;
  searched = false;
  searchTerm = '';

  constructor(private userService: UserService) {}

  search(): void {
    const q = this.searchTerm.trim();
    if (!q) {
      this.searched = false;
      this.customers = [];
      return;
    }
    this.searched = true;
    this.loading = true;
    this.userService.searchCustomers(q).subscribe({
      next: res => { this.customers = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  select(customer: UserResponse): void {
    this.customerSelected.emit(customer);
  }
}
