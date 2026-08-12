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
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { SmsReminderService } from '../services/sms-reminder.service';
import { SmsReminderLogEntry, SmsReminderRule, SmsReminderRuleRequest } from '../models/sms-reminder.model';

@Component({
  selector: 'app-sms-reminder-rules',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzSwitchModule, NzModalModule, NzIconModule, NzCardModule, NzTagModule, NzEmptyModule, NzAlertModule,
  ],
  template: `
  <div style="padding: 24px; max-width: 1000px;">
    <h2>SMS podsetnici</h2>

    <nz-alert
      nzType="info"
      nzShowIcon
      nzMessage="SMS provajder još nije podešen"
      nzDescription="Poruke se trenutno samo simuliraju (upisuju u istoriju ispod), ništa se stvarno ne šalje dok se ne poveže SMS nalog."
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
            </td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!loadingRules && rules.length === 0" nzNotFoundContent="Nema definisanih pravila"></nz-empty>
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
              <nz-tag [nzColor]="entry.status === 'SENT' ? 'green' : 'red'">
                {{ entry.status === 'SENT' ? 'Poslato' : 'Neuspešno' }}
              </nz-tag>
              <div *ngIf="entry.errorMessage" style="color:#f5222d; font-size:12px;">{{ entry.errorMessage }}</div>
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
  `,
})
export class SmsReminderRulesComponent implements OnInit {
  rules: SmsReminderRule[] = [];
  log: SmsReminderLogEntry[] = [];
  loadingRules = false;
  loadingLog = false;
  running = false;
  saving = false;

  modalVisible = false;
  editingId: number | null = null;
  formDaysOffset = 0;
  formMessageTemplate = '';
  formActive = true;

  constructor(
    private smsReminderService: SmsReminderService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.loadRules();
    this.loadLog();
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
}
