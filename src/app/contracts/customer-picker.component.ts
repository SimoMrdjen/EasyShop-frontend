import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { UserService } from '../services/user.service';
import { UserResponse } from '../models/user.model';

@Component({
  selector: 'app-customer-picker',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzInputModule, NzFormModule, NzIconModule, NzButtonModule],
  template: `
    <div>
      <nz-form-item style="max-width:360px; margin-bottom:16px;">
        <nz-form-control>
          <nz-input-group [nzPrefix]="prefixIcon">
            <input nz-input placeholder="Pretraži kupce po prezimenu..." (input)="onSearch($event)" />
          </nz-input-group>
          <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
        </nz-form-control>
      </nz-form-item>

      <nz-table [nzData]="customers" nzBordered [nzLoading]="loading" nzSize="middle"
        [nzNoResult]="searched ? 'Nema rezultata pretrage' : 'Ukucaj prezime kupca za pretragu'">
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
export class CustomerPickerComponent implements OnInit {
  @Output() customerSelected = new EventEmitter<UserResponse>();

  customers: UserResponse[] = [];
  loading = false;
  searched = false;
  private search$ = new Subject<string>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
      if (q.trim()) {
        this.searched = true;
        this.loading = true;
        this.userService.searchCustomers(q).subscribe({
          next: res => { this.customers = res; this.loading = false; },
          error: () => { this.loading = false; }
        });
      } else {
        this.searched = false;
        this.customers = [];
      }
    });
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  select(customer: UserResponse): void {
    this.customerSelected.emit(customer);
  }
}
