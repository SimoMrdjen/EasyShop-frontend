import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { AccountService } from '../services/account.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const np = group.get('newPassword')?.value;
  const cp = group.get('confirmNewPassword')?.value;
  return np && cp && np !== cp ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzCardModule],
  template: `
    <div style="padding: 40px; display: flex; justify-content: center;">
      <nz-card style="width: 420px;" nzTitle="Promena lozinke">
        <form nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">

          <nz-form-item>
            <nz-form-label nzRequired>Trenutna lozinka</nz-form-label>
            <nz-form-control nzErrorTip="Obavezno polje">
              <input nz-input type="password" formControlName="currentPassword" placeholder="Trenutna lozinka" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Nova lozinka</nz-form-label>
            <nz-form-control nzErrorTip="Min. 8 znakova, veliko/malo slovo, broj i specijalni znak">
              <input nz-input type="password" formControlName="newPassword" placeholder="Nova lozinka" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Potvrda nove lozinke</nz-form-label>
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
              <button nz-button nzType="primary" [nzLoading]="loading">Sacuvaj</button>
              <button nz-button type="button" style="margin-left: 8px;" (click)="router.navigate(['/'])">Otkazi</button>
            </nz-form-control>
          </nz-form-item>
        </form>
      </nz-card>
    </div>
  `,
})
export class ChangePasswordComponent {
  loading = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private notification: NzNotificationService,
    public router: Router
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
        ]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: passwordsMatch }
    );
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.loading = true;
    this.accountService.changePassword(this.form.value).subscribe({
      next: () => {
        this.notification.success('Uspesno', 'Lozinka je promenjena');
        this.form.reset();
        this.loading = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Greska pri promeni lozinke';
        this.notification.error('Greska', msg);
        this.loading = false;
      }
    });
  }
}
