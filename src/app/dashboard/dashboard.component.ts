import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzIconModule],
  template: `
    <div style="padding: 40px;">
      <h2>Dobrodosli, {{ username }}!</h2>
      <p style="color: #888;">Prijavljeni ste kao: <strong>{{ roleLabel }}</strong></p>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  username = '';
  roleLabel = '';

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.username = window.localStorage.getItem('username') ?? '';
      const role = window.localStorage.getItem('role');
      this.roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'EMPLOYEE' ? 'Zaposleni' : 'Kupac';
    }
  }
}
