import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { LoginRequest, LoginService } from '../services/login-service.service';
import { User } from '../models/user.model';
import { EditUserService } from '../services/edit-user.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NzFormModule, NzInputModule, NzButtonModule],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
})
export class LoginFormComponent {
  user: User = new User();

  validateForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private editUserService: EditUserService,
    private notification: NzNotificationService
  ) {
    this.validateForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      remember: [true],
    });
  }

  submitForm(): void {
    if (this.validateForm.invalid) {
      (Object.values(this.validateForm.controls) as any[]).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    let username = String(this.validateForm.value.email ?? '').trim();
    if (username && !username.includes('@')) {
      username = `${username}@easyshop.local`;
    }

    const credentials: LoginRequest = {
      username,
      password: String(this.validateForm.value.password ?? ''),
    };

    this.loginService.login(credentials).subscribe({
      next: (response) => {
        this.loginService.persistSession(response);

        const role = typeof window === 'undefined' ? null : window.localStorage.getItem('role');
        this.router.navigate([role === 'ADMIN' ? '/admin/users' : '/dashboard']);
      },
      error: () => {
        this.notification.error('Greska', 'Neispravno korisnicko ime ili lozinka');
      },
    });

    this.close();
    this.editUserService.setUser(new User());
  }

  close(): void {
    // placeholder for modal close / UI cleanup
  }
}