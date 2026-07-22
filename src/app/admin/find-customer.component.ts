import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { IdCardService } from '../services/id-card.service';
import { UserService } from '../services/user.service';
import { UserResponse } from '../models/user.model';
import { transliterateAndTitleCase } from '../utils/id-card-reader.util';

interface CompareRow {
  label: string;
  onCard: string;
  inDb: string;
  changed: boolean;
}

@Component({
  selector: 'app-find-customer',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzCardModule, NzTagModule],
  template: `
    <div style="padding: 24px; max-width: 720px;">
      <h2>Nađi kupca (po ličnoj karti)</h2>

      <nz-card>
        <button nz-button nzType="primary" [nzLoading]="reading" (click)="readAndSearch()">
          <span nz-icon nzType="idcard"></span> Očitaj sa čitača
        </button>

        <div *ngIf="searched" style="margin-top:20px;">

          <!-- Kupac pronadjen -->
          <ng-container *ngIf="customer">
            <h3 style="margin-bottom:4px;">{{ customer.firstName }} {{ customer.lastName }}</h3>
            <p style="color:#999; margin-bottom:16px;">JMBG: {{ customer.jmbg }}</p>

            <table class="compare-table">
              <thead>
                <tr><th>Podatak</th><th>Na kartici</th><th>U bazi</th><th></th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of compareRows">
                  <td>{{ row.label }}</td>
                  <td [class.changed]="row.changed">{{ row.onCard || '—' }}</td>
                  <td [class.changed]="row.changed">{{ row.inDb || '—' }}</td>
                  <td>
                    <nz-tag *ngIf="row.changed" nzColor="orange">promenjeno</nz-tag>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top:20px; display:flex; gap:8px;">
              <button nz-button nzType="primary" (click)="createContract()">
                <span nz-icon nzType="file-add"></span> Kreiraj ugovor
              </button>
              <button nz-button [disabled]="!hasChanges" [nzLoading]="updating" (click)="updateCustomerData()">
                <span nz-icon nzType="sync"></span> Ažuriraj podatke kupca
              </button>
              <button nz-button (click)="reset()">Nova pretraga</button>
            </div>
          </ng-container>

          <!-- Kupac nije pronadjen -->
          <ng-container *ngIf="!customer">
            <p>Kupac sa JMBG <strong>{{ readJmbg }}</strong> nije pronađen u bazi.</p>
            <div style="display:flex; gap:8px;">
              <button nz-button nzType="primary" (click)="createNewCustomer()">
                <span nz-icon nzType="user-add"></span> Kreiraj novog kupca
              </button>
              <button nz-button (click)="reset()">Nova pretraga</button>
            </div>
          </ng-container>

        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .compare-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .compare-table th, .compare-table td {
      border: 1px solid #e8e8e8;
      padding: 8px 12px;
      text-align: left;
    }
    .compare-table th {
      background: #fafafa;
    }
    .compare-table td.changed {
      background: #fff7e6;
      font-weight: 500;
    }
  `],
})
export class FindCustomerComponent {
  reading = false;
  updating = false;
  searched = false;
  customer: UserResponse | null = null;
  compareRows: CompareRow[] = [];
  hasChanges = false;
  readJmbg = '';

  private cardFirstName = '';
  private cardLastName = '';
  private cardAddress = '';
  private cardIdCardNumber = '';
  private cardIssuingAuthority = '';

  constructor(
    private idCardService: IdCardService,
    private userService: UserService,
    private notification: NzNotificationService,
    private router: Router,
  ) {}

  readAndSearch(): void {
    this.reading = true;
    this.idCardService.read().subscribe({
      next: data => {
        this.cardFirstName = transliterateAndTitleCase(data.firstName ?? undefined);
        this.cardLastName = transliterateAndTitleCase(data.lastName ?? undefined);
        this.cardAddress = transliterateAndTitleCase(data.address ?? undefined);
        this.cardIdCardNumber = (data.idCardNumber ?? '').trim();
        this.cardIssuingAuthority = transliterateAndTitleCase(data.issuingAuthority ?? undefined);
        this.readJmbg = (data.jmbg ?? '').trim();
        this.reading = false;

        if (!this.readJmbg) {
          this.notification.error('Greška', 'Na kartici nije pronađen JMBG');
          return;
        }

        this.userService.findCustomerByJmbg(this.readJmbg).subscribe({
          next: found => {
            this.customer = found;
            this.buildComparison();
            this.searched = true;
          },
          error: err => {
            if (err?.status === 404) {
              this.customer = null;
              this.searched = true;
            } else {
              this.notification.error('Greška', 'Nije moguće pretražiti kupca');
            }
          }
        });
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Nije moguće očitati ličnu kartu');
        this.reading = false;
      }
    });
  }

  private buildComparison(): void {
    if (!this.customer) { this.compareRows = []; return; }
    const rows: CompareRow[] = [
      { label: 'Ime', onCard: this.cardFirstName, inDb: this.customer.firstName ?? '', changed: false },
      { label: 'Prezime', onCard: this.cardLastName, inDb: this.customer.lastName ?? '', changed: false },
      { label: 'Adresa', onCard: this.cardAddress, inDb: this.customer.address ?? '', changed: false },
      { label: 'Broj lične karte', onCard: this.cardIdCardNumber, inDb: this.customer.idCardNumber ?? '', changed: false },
      { label: 'Organ izdavanja', onCard: this.cardIssuingAuthority, inDb: this.customer.issuingAuthority ?? '', changed: false },
    ];
    for (const row of rows) {
      row.changed = row.onCard.trim() !== (row.inDb ?? '').trim() && row.onCard.trim() !== '';
    }
    this.compareRows = rows;
    this.hasChanges = rows.some(r => r.changed);
  }

  updateCustomerData(): void {
    if (!this.customer) return;
    this.updating = true;
    this.userService.updateCustomer(this.customer.userId, {
      firstName: this.cardFirstName,
      lastName: this.cardLastName,
      address: this.cardAddress,
      idCardNumber: this.cardIdCardNumber,
      issuingAuthority: this.cardIssuingAuthority,
    }).subscribe({
      next: updated => {
        this.customer = updated;
        this.buildComparison();
        this.notification.success('Uspešno', 'Podaci kupca su ažurirani');
        this.updating = false;
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Nije moguće ažurirati podatke');
        this.updating = false;
      }
    });
  }

  createContract(): void {
    if (!this.customer) return;
    this.router.navigate(['/contracts/new'], { queryParams: { customerId: this.customer.profileId } });
  }

  createNewCustomer(): void {
    this.router.navigate(['/admin/users'], { queryParams: { tab: 0 } });
  }

  reset(): void {
    this.searched = false;
    this.customer = null;
    this.compareRows = [];
    this.readJmbg = '';
  }
}
