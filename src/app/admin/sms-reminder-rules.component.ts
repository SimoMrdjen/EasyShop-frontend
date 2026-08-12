import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { SmsReminderService } from '../services/sms-reminder.service';
import { UserService } from '../services/user.service';
import { ExcludedCustomer, SmsReminderLogEntry, SmsReminderRule, SmsReminderRuleRequest } from '../models/sms-reminder.model';
import { UserResponse } from '../models/user.model';

@Component({
  selector: 'app-sms-reminder-rules',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzSwitchModule, NzModalModule, NzIconModule, NzCardModule, NzTagModule, NzEmptyModule,
    NzAlertModule, NzListModule,
  ],
  template: `
  <div style="padding: 24px; max-width: 1000px;">
    <h2>SMS podsetnici</h2>

    <nz-card style="margin-bottom: 24px; border-color: #1890ff;">
      <div style="display:flex; align-items:center; justify-content: space-between;">
        <div>
          <div style="font-weight: 600; font-size: 16px;">Globalno slanje SMS podsetnika</div>
          <div style="color:#888; font-size: 13px;">
            Glavni prekidač - kad je isključeno, ništa se ne šalje ni po jednom pravilu
            (korisno npr. dok traje prelazak na novu aplikaciju).
          </div>
        </div>
        <nz-switch [ngModel]="settingsSendingEnabled" (ngModelChange)="toggleGlobalSending($event)" [nzLoading]="savingSettings"></nz-switch>
      </div>
    </nz-card>

    <nz-alert
      *ngIf="providerConnected === false"
      nzType="info"
      nzShowIcon
      nzMessage="SMS provajder još nije podešen"
      nzDescription="Poruke se trenutno samo simuliraju (upisuju u istoriju ispod), ništa se stvarno ne šalje dok se ne poveže SMS nalog."
      style="margin-bottom: 16px;">
    </nz-alert>
    <nz-alert
      *ngIf="providerConnected === true"
      nzType="success"
      nzShowIcon
      nzMessage="SMS provajder je povezan"
      nzDescription="Poruke se stvarno šalju na brojeve telefona kupaca."
      style="margin-bottom: 16px;">
    </nz-alert>

    <nz-card nzTitle="Pravila za slanje" style="margin-bottom: 24px;">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #888;">Broj dana: 0 = na dan dospeća rate, veći broj = toliko dana posle dospeća (kašnjenje).</span>
        <button nz-button nzType="primary" (click)="openNewRuleModal()">
          <span nz-icon nzType="plus"></span> Novo pravilo
        </button>
      </div>

      <nz-table [nzData]="rules" [nzShowPagination]="false" [nzLoading]="loadingRules">
        <thead>
          <tr>
            <th>Broj dana</th>
            <th>Tekst poruke</th>
            <th>Aktivno</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let rule of rules">
            <td>{{ rule.daysOffset === 0 ? 'Na dan dospeća' : (rule.daysOffset + ' dana posle dospeća') }}</td>
            <td style="max-width: 400px; white-space: pre-wrap;">{{ rule.messageTemplate }}</td>
            <td>
              <nz-tag [nzColor]="rule.active ? 'green' : 'default'">{{ rule.active ? 'Aktivno' : 'Isključeno' }}</nz-tag>
            </td>
            <td>
              <button nz-button nzType="link" (click)="openEditRuleModal(rule)">Izmeni</button>
              <button nz-button nzType="link" nzDanger (click)="deleteRule(rule)">Obriši</button>
              <button *ngIf="rule.daysOffset > 0" nz-button nzType="link" (click)="openMarkOldModal(rule)">
                Označi staro kao obavešteno
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loadingRules && rules.length === 0" nzNotFoundContent="Nema definisanih pravila"></nz-empty>
    </nz-card>

    <nz-card nzTitle="Kupci isključeni iz SMS podsetnika" style="margin-bottom: 24px;">
      <div style="display:flex; gap:8px; margin-bottom: 12px;">
        <input nz-input placeholder="Pretraži kupca po prezimenu..." [(ngModel)]="excludeSearchTerm" (keyup.enter)="searchCustomersToExclude()" />
        <button nz-button (click)="searchCustomersToExclude()" [nzLoading]="searchingCustomers">Pretraži</button>
      </div>

      <div *ngIf="excludeSearchResults.length > 0" style="margin-bottom: 16px; border: 1px solid #f0f0f0; border-radius: 4px;">
        <div *ngFor="let c of excludeSearchResults" style="display:flex; justify-content: space-between; align-items:center; padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">
          <span>{{ c.firstName }} {{ c.lastName }} <span style="color:#888;">({{ c.phoneNumber }})</span></span>
          <button nz-button nzSize="small" (click)="excludeCustomer(c)">Isključi</button>
        </div>
      </div>

      <div style="font-weight: 600; margin-bottom: 8px;">Trenutno isključeni:</div>
      <nz-table [nzData]="excludedCustomers" [nzShowPagination]="false" [nzLoading]="loadingExcluded">
        <thead>
          <tr>
            <th>Kupac</th>
            <th>Telefon</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of excludedCustomers">
            <td>{{ c.fullName }}</td>
            <td>{{ c.phoneNumber }}</td>
            <td><button nz-button nzType="link" (click)="includeCustomer(c)">Uključi nazad</button></td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loadingExcluded && excludedCustomers.length === 0" nzNotFoundContent="Nema isključenih kupaca"></nz-empty>
    </nz-card>

    <nz-card nzTitle="Istorija poslatih podsetnika">
      <button nz-button (click)="runNow()" [nzLoading]="running" style="margin-bottom: 12px;">
        <span nz-icon nzType="thunderbolt"></span> Pošalji odmah (test)
      </button>

      <nz-table [nzData]="log" [nzPageSize]="20" [nzLoading]="loadingLog">
        <thead>
          <tr>
            <th>Datum/vreme</th>
            <th>Kupac</th>
            <th>Telefon</th>
            <th>Ugovor / rata</th>
            <th>Status</th>
            <th>Poruka</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let entry of log">
            <td>{{ entry.sentAt | date:'dd.MM.yyyy. HH:mm' }}</td>
            <td>{{ entry.customerName }}</td>
            <td>{{ entry.phoneNumber }}</td>
            <td>{{ entry.contractId ? ('#' + entry.contractId + ' / rata ' + entry.installmentOrdinal) : '-' }}</td>
            <td>
              <nz-tag [nzColor]="statusColor(entry.status)">{{ statusLabel(entry.status) }}</nz-tag>
              <div *ngIf="entry.errorMessage" style="color:#888; font-size:12px;">{{ entry.errorMessage }}</div>
            </td>
            <td style="max-width: 300px; white-space: pre-wrap;">{{ entry.message }}</td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loadingLog && log.length === 0" nzNotFoundContent="Još uvek nema poslatih podsetnika"></nz-empty>
    </nz-card>
  </div>

  <nz-modal
    [(nzVisible)]="modalVisible"
    [nzTitle]="editingId ? 'Izmena pravila' : 'Novo pravilo'"
    (nzOnCancel)="modalVisible = false"
    (nzOnOk)="saveRule()"
    [nzOkLoading]="saving">
    <ng-container *nzModalContent>
      <form nz-form nzLayout="vertical">
        <nz-form-item>
          <nz-form-label nzRequired>Broj dana u odnosu na dospeće</nz-form-label>
          <nz-form-control nzExtra="0 = na dan dospeća, npr. 15 = 15 dana posle dospeća (kašnjenje)">
            <nz-input-number [(ngModel)]="formDaysOffset" name="daysOffset" [nzMin]="0" style="width: 100%;"></nz-input-number>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label nzRequired>Tekst poruke</nz-form-label>
          <nz-form-control nzExtra="Dostupne promenljive: {{ '{' }}ime{{ '}' }}, {{ '{' }}prezime{{ '}' }}, {{ '{' }}iznos{{ '}' }}, {{ '{' }}ugovor{{ '}' }}, {{ '{' }}datum{{ '}' }}">
            <textarea nz-input [(ngModel)]="formMessageTemplate" name="messageTemplate" rows="4"
              placeholder="Poštovani {{ '{' }}ime{{ '}' }}, rata od {{ '{' }}iznos{{ '}' }} din. za ugovor {{ '{' }}ugovor{{ '}' }} dospeva {{ '{' }}datum{{ '}' }}. STR DUO"></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Aktivno</nz-form-label>
          <nz-form-control>
            <nz-switch [(ngModel)]="formActive" name="active"></nz-switch>
          </nz-form-control>
        </nz-form-item>
      </form>
    </ng-container>
  </nz-modal>

  <nz-modal
    [(nzVisible)]="markOldModalVisible"
    nzTitle="Označi staro kao obavešteno"
    (nzOnCancel)="markOldModalVisible = false"
    (nzOnOk)="confirmMarkOldAsNotified()"
    [nzOkLoading]="markingOld"
    nzOkText="Označi">
    <ng-container *nzModalContent>
      <p>
        Ovo NEĆE poslati nijednu SMS poruku - samo će rate starije od zadatog broja dana
        biti označene kao da su već obaveštene (npr. jer je ranije ručno poslata poruka iz stare
        aplikacije), tako da ih automatsko slanje ubuduće preskoči za ovo pravilo.
      </p>
      <nz-form-item>
        <nz-form-label nzRequired>Stariji od (dana)</nz-form-label>
        <nz-form-control>
          <nz-input-number [(ngModel)]="markOldThresholdDays" name="markOldThresholdDays" [nzMin]="1" style="width: 100%;"></nz-input-number>
        </nz-form-control>
      </nz-form-item>
    </ng-container>
  </nz-modal>
  `,
})
export class SmsReminderRulesComponent implements OnInit {
  rules: SmsReminderRule[] = [];
  log: SmsReminderLogEntry[] = [];
  excludedCustomers: ExcludedCustomer[] = [];
  excludeSearchTerm = '';
  excludeSearchResults: UserResponse[] = [];
  providerConnected: boolean | null = null;
  settingsSendingEnabled = true;
  loadingRules = false;
  loadingLog = false;
  loadingExcluded = false;
  searchingCustomers = false;
  savingSettings = false;
  running = false;
  saving = false;

  modalVisible = false;
  editingId: number | null = null;
  formDaysOffset = 0;
  formMessageTemplate = '';
  formActive = true;

  markOldModalVisible = false;
  markingOld = false;
  markOldRuleId: number | null = null;
  markOldThresholdDays = 45;

  constructor(
    private smsReminderService: SmsReminderService,
    private userService: UserService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.loadRules();
    this.loadLog();
    this.loadExcludedCustomers();
    this.smsReminderService.getStatus().subscribe({
      next: (status) => { this.providerConnected = status.providerConnected; },
      error: () => { this.providerConnected = false; },
    });
    this.smsReminderService.getSettings().subscribe({
      next: (settings) => { this.settingsSendingEnabled = settings.sendingEnabled; },
      error: () => {},
    });
  }

  toggleGlobalSending(value: boolean): void {
    this.savingSettings = true;
    this.smsReminderService.updateSettings({ sendingEnabled: value }).subscribe({
      next: (settings) => {
        this.settingsSendingEnabled = settings.sendingEnabled;
        this.savingSettings = false;
        this.notification.success('Sačuvano', settings.sendingEnabled ? 'Slanje SMS podsetnika je uključeno' : 'Slanje SMS podsetnika je isključeno');
      },
      error: () => {
        this.savingSettings = false;
        this.notification.error('Greška', 'Izmena podešavanja nije uspela');
      },
    });
  }

  loadRules(): void {
    this.loadingRules = true;
    this.smsReminderService.getRules().subscribe({
      next: (rules) => { this.rules = rules; this.loadingRules = false; },
      error: () => { this.loadingRules = false; this.notification.error('Greška', 'Nije moguće učitati pravila'); },
    });
  }

  loadLog(): void {
    this.loadingLog = true;
    this.smsReminderService.getLog().subscribe({
      next: (log) => { this.log = log; this.loadingLog = false; },
      error: () => { this.loadingLog = false; this.notification.error('Greška', 'Nije moguće učitati istoriju'); },
    });
  }

  loadExcludedCustomers(): void {
    this.loadingExcluded = true;
    this.smsReminderService.getExcludedCustomers().subscribe({
      next: (list) => { this.excludedCustomers = list; this.loadingExcluded = false; },
      error: () => { this.loadingExcluded = false; },
    });
  }

  searchCustomersToExclude(): void {
    if (!this.excludeSearchTerm.trim()) {
      return;
    }
    this.searchingCustomers = true;
    this.userService.searchCustomers(this.excludeSearchTerm.trim()).subscribe({
      next: (results) => { this.excludeSearchResults = results; this.searchingCustomers = false; },
      error: () => { this.searchingCustomers = false; this.notification.error('Greška', 'Pretraga nije uspela'); },
    });
  }

  excludeCustomer(customer: UserResponse): void {
    this.smsReminderService.excludeCustomer(customer.profileId).subscribe({
      next: () => {
        this.notification.success('Isključeno', 'Kupac neće više dobijati SMS podsetnike');
        this.excludeSearchResults = this.excludeSearchResults.filter(c => c.profileId !== customer.profileId);
        this.loadExcludedCustomers();
      },
      error: () => this.notification.error('Greška', 'Isključivanje nije uspelo'),
    });
  }

  includeCustomer(customer: ExcludedCustomer): void {
    this.smsReminderService.includeCustomer(customer.customerId).subscribe({
      next: () => {
        this.notification.success('Uključeno', 'Kupac će opet dobijati SMS podsetnike');
        this.loadExcludedCustomers();
      },
      error: () => this.notification.error('Greška', 'Uključivanje nije uspelo'),
    });
  }

  openNewRuleModal(): void {
    this.editingId = null;
    this.formDaysOffset = 0;
    this.formMessageTemplate = '';
    this.formActive = true;
    this.modalVisible = true;
  }

  openEditRuleModal(rule: SmsReminderRule): void {
    this.editingId = rule.id;
    this.formDaysOffset = rule.daysOffset;
    this.formMessageTemplate = rule.messageTemplate;
    this.formActive = rule.active;
    this.modalVisible = true;
  }

  saveRule(): void {
    if (this.formDaysOffset === null || this.formDaysOffset === undefined || !this.formMessageTemplate.trim()) {
      this.notification.warning('Nepotpuno', 'Popuni broj dana i tekst poruke');
      return;
    }
    const req: SmsReminderRuleRequest = {
      daysOffset: this.formDaysOffset,
      messageTemplate: this.formMessageTemplate,
      active: this.formActive,
    };
    this.saving = true;
    const obs = this.editingId
      ? this.smsReminderService.updateRule(this.editingId, req)
      : this.smsReminderService.createRule(req);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.modalVisible = false;
        this.notification.success('Sačuvano', 'Pravilo je sačuvano');
        this.loadRules();
      },
      error: () => {
        this.saving = false;
        this.notification.error('Greška', 'Čuvanje pravila nije uspelo');
      },
    });
  }

  openMarkOldModal(rule: SmsReminderRule): void {
    this.markOldRuleId = rule.id;
    this.markOldThresholdDays = 45;
    this.markOldModalVisible = true;
  }

  confirmMarkOldAsNotified(): void {
    if (!this.markOldRuleId || !this.markOldThresholdDays || this.markOldThresholdDays < 1) {
      return;
    }
    this.markingOld = true;
    this.smsReminderService.markOldAsNotified(this.markOldRuleId, this.markOldThresholdDays).subscribe({
      next: (result) => {
        this.markingOld = false;
        this.markOldModalVisible = false;
        this.notification.success('Označeno', `Označeno kao već obavešteno: ${result.markedCount} rata`);
        this.loadLog();
      },
      error: () => {
        this.markingOld = false;
        this.notification.error('Greška', 'Označavanje nije uspelo');
      },
    });
  }

  deleteRule(rule: SmsReminderRule): void {
    this.smsReminderService.deleteRule(rule.id).subscribe({
      next: () => { this.notification.success('Obrisano', 'Pravilo je obrisano'); this.loadRules(); },
      error: () => this.notification.error('Greška', 'Brisanje nije uspelo'),
    });
  }

  runNow(): void {
    this.running = true;
    this.smsReminderService.runNow().subscribe({
      next: () => {
        this.running = false;
        this.notification.success('Pokrenuto', 'Provera je izvršena, pogledaj istoriju ispod');
        this.loadLog();
      },
      error: () => {
        this.running = false;
        this.notification.error('Greška', 'Pokretanje nije uspelo');
      },
    });
  }

  statusColor(status: string): string {
    if (status === 'SENT') return 'green';
    if (status === 'SKIPPED') return 'orange';
    return 'red';
  }

  statusLabel(status: string): string {
    if (status === 'SENT') return 'Poslato';
    if (status === 'SKIPPED') return 'Preskočeno';
    return 'Neuspešno';
  }
}
