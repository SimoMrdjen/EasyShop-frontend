import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NzFormModule, NzInputModule, NzButtonModule, NzCardModule, NzAlertModule],
  template: `
    <div style="padding: 40px; display: flex; justify-content: center;">
      <nz-card style="width: 420px;" nzTitle="Zaboravljena lozinka">

        <nz-alert
          *ngIf="sent"
          nzType="success"
          nzMessage="Ako korisnicko ime postoji, poslan je email sa uputstvom za reset lozinke."
          style="margin-bottom: 16px;"
        ></nz-alert>

        <form *ngIf="!sent" nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Korisnicko ime</nz-form-label>
            <nz-form-control nzErrorTip="Unesite korisnicko ime">
              <input nz-input formControlName="userName" placeholder="Vase korisnicko ime" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <button nz-button nzType="primary" [nzLoading]="loading">Posalji link za reset</button>
            </nz-form-control>
          </nz-form-item>
        </form>

        <div style="margin-top: 12px;">
          <a routerLink="/login">Nazad na prijavu</a>
        </div>
      </nz-card>
    </div>
  `,
})
export class ForgotPasswordComponent {
  loading = false;
  sent = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private notification: NzNotificationService
  ) {
    this.form = this.fb.group({
      userName: ['', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.controls['userName'].markAsDirty();
      return;
    }

    this.loading = true;
    this.accountService.forgotPassword(this.form.value).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
      },
      error: () => {
        // backend uvek vraca 204 da ne otkriva da li username postoji
        this.sent = true;
        this.loading = false;
      }
    });
  }
}
