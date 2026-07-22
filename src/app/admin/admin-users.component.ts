import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { UserService } from '../services/user.service';
import { IdCardService } from '../services/id-card.service';
import { UserResponse } from '../models/user.model';
import { parseIdCardText, transliterateAndTitleCase } from '../utils/id-card-reader.util';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzTableModule, NzButtonModule, NzFormModule,
    NzInputModule, NzSelectModule, NzModalModule, NzIconModule,
    NzCardModule, NzDividerModule, NzTagModule, NzEmptyModule,
    NzToolTipModule, NzAlertModule,
  ],
  template: `
  <div style="padding: 24px;">

    <!-- ===== NOVI KORISNIK (tab=0) ===== -->
    <ng-container *ngIf="activeTab === 0">
      <h2>Novi korisnik</h2>
      <nz-card style="max-width: 600px;">
        <form nz-form [formGroup]="createForm" (ngSubmit)="createUser()" nzLayout="vertical">

          <nz-form-item>
            <nz-form-label nzRequired>Email (korisnicko ime)</nz-form-label>
            <nz-form-control nzErrorTip="Obavezno polje">
              <nz-input-group [nzSuffix]="regenEmailTpl">
                <input nz-input formControlName="username" placeholder="npr. marko.petrovic@gmail.com" />
              </nz-input-group>
              <ng-template #regenEmailTpl>
                <span nz-icon nzType="reload" style="cursor:pointer;" nz-tooltip
                  nzTooltipTitle="Generiši nasumično" (click)="regenerateUsername()"></span>
              </ng-template>
            </nz-form-control>
            <div style="font-size:12px; color:#999; margin-top:2px;">
              Ako kupac ne želi da da svoj email, ostavi automatski generisanu vrednost.
            </div>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Lozinka</nz-form-label>
            <nz-form-control nzErrorTip="Obavezno polje">
              <nz-input-group [nzSuffix]="regenPasswordTpl">
                <input nz-input type="password" formControlName="password" placeholder="Lozinka" />
              </nz-input-group>
              <ng-template #regenPasswordTpl>
                <span nz-icon nzType="reload" style="cursor:pointer;" nz-tooltip
                  nzTooltipTitle="Generiši nasumično" (click)="regeneratePassword()"></span>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Uloga</nz-form-label>
            <nz-form-control nzErrorTip="Odaberite ulogu">
              <nz-select formControlName="role">
                <nz-option nzLabel="Kupac" nzValue="CUSTOMER"></nz-option>
                <ng-container *ngIf="isAdmin">
                  <nz-option nzLabel="Zaposleni" nzValue="EMPLOYEE"></nz-option>
                  <nz-option nzLabel="Administrator" nzValue="ADMIN"></nz-option>
                </ng-container>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-divider nzText="Licni podaci"></nz-divider>

          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Ime</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="firstName" placeholder="Ime" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Prezime</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="lastName" placeholder="Prezime" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label>Telefon</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="phoneNumber" placeholder="+381..." />
            </nz-form-control>
          </nz-form-item>

          <ng-container *ngIf="createForm.get('role')?.value === 'CUSTOMER'">
            <nz-divider nzText="Učitavanje sa čitača lične karte"></nz-divider>

            <button nz-button type="button" [nzLoading]="readingCard" (click)="readFromDevice(createForm)" style="margin-bottom:12px;">
              <span nz-icon nzType="idcard"></span> Očitaj sa čitača
            </button>

            <nz-form-item>
              <nz-form-control>
                <textarea nz-input rows="2" #idCardPasteBox
                  placeholder="Ili nalepi ovde (Ctrl+V) podatke kopirane iz Čitač aplikacije, ako čitač nije podešen"
                  (paste)="onIdCardPaste($event, createForm, idCardPasteBox)"></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-divider nzText="Podaci o kupcu"></nz-divider>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>JMBG</nz-form-label>
                  <nz-form-control>
                    <input nz-input formControlName="jmbg" placeholder="0000000000000" />
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>Broj licne karte</nz-form-label>
                  <nz-form-control>
                    <input nz-input formControlName="idCardNumber" placeholder="000000000" />
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <nz-form-item>
              <nz-form-label>Adresa</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="address" placeholder="Ulica i broj, grad" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Organ izdavanja</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="issuingAuthority" placeholder="MUP Beograd" />
              </nz-form-control>
            </nz-form-item>
          </ng-container>

          <nz-form-item>
            <nz-form-control>
              <button nz-button nzType="primary" [nzLoading]="saving">Kreiraj korisnika</button>
            </nz-form-control>
          </nz-form-item>
        </form>
      </nz-card>

      <nz-alert *ngIf="lastActionCustomer" nzType="success" nzShowIcon style="max-width:600px; margin-top:16px;"
        [nzMessage]="'Kupac ' + lastActionCustomer.firstName + ' ' + lastActionCustomer.lastName + ' je sačuvan.'"
        [nzAction]="createContractAction" (nzOnClose)="lastActionCustomer = null" nzCloseable>
      </nz-alert>
    </ng-container>

    <!-- ===== KUPCI (tab=1) ===== -->
    <ng-container *ngIf="activeTab === 1">
      <h2>Kupci</h2>

      <nz-alert *ngIf="lastActionCustomer" nzType="success" nzShowIcon style="max-width:600px; margin-bottom:16px;"
        [nzMessage]="'Podaci za ' + lastActionCustomer.firstName + ' ' + lastActionCustomer.lastName + ' su ažurirani.'"
        [nzAction]="createContractAction" (nzOnClose)="lastActionCustomer = null" nzCloseable>
      </nz-alert>
      <nz-form-item style="max-width: 320px; margin-bottom: 16px;">
        <nz-form-control>
          <input nz-input placeholder="Ukucaj prezime kupca za pretragu..." (input)="onCustomerSearch($event)" />
        </nz-form-control>
      </nz-form-item>

      <nz-table [nzData]="customers" nzBordered [nzLoading]="loadingCustomers" nzSize="middle"
        [nzNoResult]="customerSearched ? 'Nema rezultata pretrage' : 'Ukucaj prezime kupca za pretragu'">
        <thead>
          <tr>
            <th>Ime i prezime</th>
            <th>Email</th>
            <th>Telefon</th>
            <th>JMBG</th>
            <th>Br. lične karte</th>
            <th>Adresa</th>
            <th style="width:90px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of customers">
            <td><strong>{{ u.firstName }} {{ u.lastName }}</strong></td>
            <td>{{ u.username }}</td>
            <td>{{ u.phoneNumber }}</td>
            <td>{{ u.jmbg }}</td>
            <td>{{ u.idCardNumber }}</td>
            <td>{{ u.address }}</td>
            <td>
              <button nz-button nzSize="small" nzType="default" (click)="openEditModal(u)">
                <span nz-icon nzType="edit"></span> Izmeni
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </ng-container>

    <!-- ===== MODAL: Izmena podataka kupca ===== -->
    <nz-modal
      [(nzVisible)]="editModalVisible"
      [nzTitle]="editingCustomer ? 'Izmena: ' + editingCustomer.firstName + ' ' + editingCustomer.lastName : 'Izmena kupca'"
      nzOkText="Sačuvaj"
      nzCancelText="Odustani"
      [nzOkLoading]="editSaving"
      (nzOnOk)="saveEdit()"
      (nzOnCancel)="closeEditModal()">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="editForm" nzLayout="vertical">

          <button nz-button type="button" [nzLoading]="readingCard" (click)="readFromDevice(editForm)" style="margin-bottom:12px;">
            <span nz-icon nzType="idcard"></span> Očitaj sa čitača
          </button>

          <nz-form-item>
            <nz-form-control>
              <textarea nz-input rows="2" #editIdCardPasteBox
                placeholder="Ili nalepi ovde (Ctrl+V) podatke kopirane iz Čitač aplikacije, ako čitač nije podešen"
                (paste)="onIdCardPaste($event, editForm, editIdCardPasteBox)"></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-divider nzText="Podaci"></nz-divider>

          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Ime</nz-form-label>
                <nz-form-control nzErrorTip="Obavezno polje">
                  <input nz-input formControlName="firstName" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Prezime</nz-form-label>
                <nz-form-control nzErrorTip="Obavezno polje">
                  <input nz-input formControlName="lastName" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label>Telefon</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="phoneNumber" placeholder="+381..." />
            </nz-form-control>
          </nz-form-item>

          <nz-divider nzText="Lična karta"></nz-divider>

          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>JMBG</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="jmbg" maxlength="13" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Broj lične karte</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="idCardNumber" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label>Adresa</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="address" placeholder="Ulica i broj, grad" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Organ izdavanja</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="issuingAuthority" placeholder="MUP Beograd" />
            </nz-form-control>
          </nz-form-item>

        </form>
      </ng-container>
    </nz-modal>

    <!-- ===== ZAPOSLENI (tab=2) ===== -->
    <ng-container *ngIf="activeTab === 2">
      <h2>Zaposleni</h2>
      <nz-form-item style="max-width: 320px; margin-bottom: 16px;">
        <nz-form-control>
          <input nz-input placeholder="Pretrazi zaposlene..." (input)="onEmployeeSearch($event)" />
        </nz-form-control>
      </nz-form-item>

      <nz-table [nzData]="employees" nzBordered [nzLoading]="loadingEmployees">
        <thead>
          <tr>
            <th>ID</th>
            <th>Korisnicko ime</th>
            <th>Ime i prezime</th>
            <th>Email</th>
            <th>Telefon</th>
            <th>Uloga</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of employees">
            <td>{{ u.userId }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.firstName }} {{ u.lastName }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.phoneNumber }}</td>
            <td><nz-tag [nzColor]="u.role === 'ADMIN' ? 'red' : 'blue'">{{ u.role }}</nz-tag></td>
          </tr>
        </tbody>
      </nz-table>
    </ng-container>

    <ng-template #createContractAction>
      <button nz-button nzType="primary" nzSize="small" (click)="createContractForLastCustomer()">
        <span nz-icon nzType="file-add"></span> Kreiraj ugovor
      </button>
    </ng-template>

  </div>
  `,
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  activeTab = 0;
  isAdmin = false;

  createForm: FormGroup;
  editForm: FormGroup;
  customers: UserResponse[] = [];
  employees: UserResponse[] = [];
  saving = false;
  loadingCustomers = false;
  loadingEmployees = false;
  customerSearched = false;

  editModalVisible = false;
  editSaving = false;
  editingCustomer: UserResponse | null = null;
  lastActionCustomer: UserResponse | null = null;
  readingCard = false;

  private customerSearch$ = new Subject<string>();
  private employeeSearch$ = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private userService: UserService,
    private idCardService: IdCardService,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.createForm = this.fb.group({
      username: [this.generateRandomUsername(), Validators.required],
      password: [this.generateRandomPassword(), Validators.required],
      role: ['CUSTOMER', Validators.required],
      firstName: [''],
      lastName: [''],
      email: [''],
      phoneNumber: [''],
      jmbg: [''],
      address: [''],
      idCardNumber: [''],
      issuingAuthority: [''],
    });

    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: [''],
      jmbg: [''],
      address: [''],
      idCardNumber: [''],
      issuingAuthority: [''],
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isAdmin = window.localStorage.getItem('role') === 'ADMIN';
    }

    this.subs.add(
      this.route.queryParamMap.subscribe(params => {
        const tab = Number(params.get('tab') ?? 0);
        this.activeTab = tab;
        this.lastActionCustomer = null;
        if (tab === 2 && this.employees.length === 0) {
          this.loadAllEmployees();
        }
      })
    );

    this.subs.add(
      this.customerSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
        if (q.trim()) {
          this.customerSearched = true;
          this.loadingCustomers = true;
          this.userService.searchCustomers(q).subscribe({
            next: res => { this.customers = res; this.loadingCustomers = false; },
            error: () => { this.loadingCustomers = false; }
          });
        } else {
          this.customerSearched = false;
          this.customers = [];
        }
      })
    );

    this.subs.add(
      this.employeeSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
        if (q.trim()) {
          this.loadingEmployees = true;
          this.userService.searchEmployees(q).subscribe({
            next: res => { this.employees = res; this.loadingEmployees = false; },
            error: () => { this.loadingEmployees = false; }
          });
        } else {
          this.loadAllEmployees();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadAllEmployees(): void {
    this.loadingEmployees = true;
    this.userService.getAllEmployees().subscribe({
      next: res => { this.employees = res; this.loadingEmployees = false; },
      error: () => { this.loadingEmployees = false; }
    });
  }

  onCustomerSearch(event: Event): void {
    this.customerSearch$.next((event.target as HTMLInputElement).value);
  }

  onEmployeeSearch(event: Event): void {
    this.employeeSearch$.next((event.target as HTMLInputElement).value);
  }

  createUser(): void {
    if (this.createForm.invalid) {
      Object.values(this.createForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.saving = true;
    this.userService.create(this.createForm.value).subscribe({
      next: created => {
        this.notification.success('Uspesno', 'Korisnik je kreiran');
        this.lastActionCustomer = created.role === 'CUSTOMER' ? created : null;
        this.createForm.reset({
          role: 'CUSTOMER',
          username: this.generateRandomUsername(),
          password: this.generateRandomPassword(),
        });
        this.saving = false;
      },
      error: err => {
        this.notification.error('Greska', err?.error?.detail ?? 'Nije moguce kreirati korisnika');
        this.saving = false;
      }
    });
  }

  onIdCardPaste(event: ClipboardEvent, form: FormGroup, textarea: HTMLTextAreaElement): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const parsed = parseIdCardText(text);

    if (!parsed.firstName && !parsed.lastName && !parsed.jmbg) {
      this.notification.error('Greška', 'Nije prepoznat format podataka iz čitača lične karte');
      return;
    }

    const patch: Record<string, string> = {};
    if (parsed.firstName) patch['firstName'] = transliterateAndTitleCase(parsed.firstName);
    if (parsed.lastName) patch['lastName'] = transliterateAndTitleCase(parsed.lastName);
    if (parsed.jmbg) patch['jmbg'] = parsed.jmbg.trim();
    if (parsed.address) patch['address'] = transliterateAndTitleCase(parsed.address);
    if (parsed.idCardNumber) patch['idCardNumber'] = parsed.idCardNumber.trim();
    if (parsed.issuingAuthority) patch['issuingAuthority'] = transliterateAndTitleCase(parsed.issuingAuthority);

    form.patchValue(patch);
    this.notification.success('Uspešno', 'Podaci su učitani iz čitača lične karte');
    textarea.value = '';
  }

  readFromDevice(form: FormGroup): void {
    this.readingCard = true;
    this.idCardService.read().subscribe({
      next: data => {
        const patch: Record<string, string> = {};
        if (data.firstName) patch['firstName'] = transliterateAndTitleCase(data.firstName);
        if (data.lastName) patch['lastName'] = transliterateAndTitleCase(data.lastName);
        if (data.jmbg) patch['jmbg'] = data.jmbg.trim();
        if (data.address) patch['address'] = transliterateAndTitleCase(data.address);
        if (data.idCardNumber) patch['idCardNumber'] = data.idCardNumber.trim();
        if (data.issuingAuthority) patch['issuingAuthority'] = transliterateAndTitleCase(data.issuingAuthority);
        form.patchValue(patch);
        this.notification.success('Uspešno', 'Podaci su očitani sa čitača');
        this.readingCard = false;
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Nije moguće očitati ličnu kartu');
        this.readingCard = false;
      }
    });
  }

  createContractForLastCustomer(): void {
    if (!this.lastActionCustomer) return;
    this.router.navigate(['/contracts/new'], { queryParams: { customerId: this.lastActionCustomer.profileId } });
  }

  regenerateUsername(): void {
    this.createForm.get('username')?.setValue(this.generateRandomUsername());
  }

  regeneratePassword(): void {
    this.createForm.get('password')?.setValue(this.generateRandomPassword());
  }

  private generateRandomUsername(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    return `kupac.${rand}@easyshop.local`;
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  openEditModal(customer: UserResponse): void {
    this.editingCustomer = customer;
    this.editForm.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phoneNumber ?? '',
      jmbg: customer.jmbg ?? '',
      address: customer.address ?? '',
      idCardNumber: customer.idCardNumber ?? '',
      issuingAuthority: customer.issuingAuthority ?? '',
    });
    this.editModalVisible = true;
  }

  closeEditModal(): void {
    this.editModalVisible = false;
    this.editingCustomer = null;
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingCustomer) {
      Object.values(this.editForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.editSaving = true;
    this.userService.updateCustomer(this.editingCustomer.userId, this.editForm.value).subscribe({
      next: updated => {
        this.customers = this.customers.map(c => c.userId === updated.userId ? updated : c);
        this.notification.success('Uspešno', 'Podaci kupca su ažurirani');
        this.closeEditModal();
        this.editSaving = false;
        this.lastActionCustomer = updated;
      },
      error: err => {
        this.notification.error('Greška', err?.error?.detail ?? 'Nije moguće ažurirati podatke');
        this.editSaving = false;
      }
    });
  }
}
