import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { AccountService } from '../services/account.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const np = group.get('newPassword')?.value;
  const cp = group.get('confirmNewPassword')?.value;
  return np && cp && np !== cp ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NzFormModule, NzInputModule, NzButtonModule, NzCardModule, NzAlertModule],
  template: `
    <div style="padding: 40px; display: flex; justify-content: center;">
      <nz-card style="width: 420px;" nzTitle="Reset lozinke">

        <nz-alert
          *ngIf="!token"
          nzType="error"
          nzMessage="Nevazeci link za reset. Molimo zatrazite novi."
          style="margin-bottom: 16px;"
        ></nz-alert>

        <nz-alert
          *ngIf="done"
          nzType="success"
          nzMessage="Lozinka je uspesno promenjena. Mozete se prijaviti."
          style="margin-bottom: 16px;"
        ></nz-alert>

        <form *ngIf="token && !done" nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Nova lozinka</nz-form-label>
            <nz-form-control nzErrorTip="Min. 8 znakova, veliko/malo slovo, broj i specijalni znak">
              <input nz-input type="password" formControlName="newPassword" placeholder="Nova lozinka" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Potvrda lozinke</nz-form-label>
            <nz-form-control [nzErrorTip]="confirmError">
              <input nz-input type="password" formControlName="confirmNewPassword" placeholder="Ponovite novu lozinku" />
            </nz-form-control>
            <ng-template #confirmError>
              <span *ngIf="form.get('confirmNewPassword')?.errors?.['required']">Obavezno polje</span>
              <span *ngIf="form.hasError('mismatch')">Lozinke se ne poklapaju</span>
            </ng-template>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <button nz-button nzType="primary" [nzLoading]="loading">Sacuvaj lozinku</button>
            </nz-form-control>
          </nz-form-item>
        </form>

        <div style="margin-top: 12px;">
          <a routerLink="/login">Prijava</a>
        </div>
      </nz-card>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  loading = false;
  done = false;
  token: string | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private notification: NzNotificationService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        newPassword: ['', [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
        ]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: passwordsMatch }
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit(): void {
    if (this.form.invalid || !this.token) return;

    this.loading = true;
    this.accountService.resetPassword({
      token: this.token,
      ...this.form.value
    }).subscribe({
      next: () => {
        this.done = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        const msg = err?.status === 400 ? 'Link je istekao ili nevazeci.' : 'Greska pri resetu lozinke.';
        this.notification.error('Greska', msg);
        this.loading = false;
      }
    });
  }
}
