import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzMenuModule,
    NzLayoutModule,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzModalModule,
  ],
  template: `
    <nz-header class="navbar">
      <div class="navbar-brand">
        <span class="logo-text">EasyShop</span>
      </div>

      <ul nz-menu nzTheme="dark" nzMode="horizontal" class="navbar-menu">

        <!-- Admin i zaposleni vide unos i kupce -->
        <ng-container *ngIf="isAdmin || isEmployee">
          <li nz-menu-item routerLink="/admin/users" [queryParams]="{tab: 0}">
            <span nz-icon nzType="user-add"></span>
            Novi korisnik
          </li>
          <li nz-menu-item routerLink="/admin/users" [queryParams]="{tab: 1}">
            <span nz-icon nzType="team"></span>
            Kupci
          </li>
          <li nz-menu-item routerLink="/customers/find">
            <span nz-icon nzType="idcard"></span>
            Nađi kupca
          </li>
        </ng-container>

        <!-- Samo admin vidi zaposlene -->
        <ng-container *ngIf="isAdmin">
          <li nz-menu-item routerLink="/admin/users" [queryParams]="{tab: 2}">
            <span nz-icon nzType="idcard"></span>
            Zaposleni
          </li>
        </ng-container>

        <!-- Ugovori i rate (admin i zaposleni) -->
        <ng-container *ngIf="isAdmin || isEmployee">
          <li nz-menu-item routerLink="/contracts">
            <span nz-icon nzType="file-text"></span>
            Ugovori
          </li>
          <li nz-menu-item routerLink="/contracts/new">
            <span nz-icon nzType="file-add"></span>
            Novi ugovor
          </li>
          <li nz-menu-item routerLink="/installments/overdue">
            <span nz-icon nzType="warning"></span>
            Dospele rate
          </li>
          <li nz-menu-item routerLink="/reports/daily">
            <span nz-icon nzType="bar-chart"></span>
            Dnevni izveštaj
          </li>
          <li nz-menu-item routerLink="/bank-statements/import">
            <span nz-icon nzType="bank"></span>
            Uvoz izvoda
          </li>
        </ng-container>

        <li class="spacer"></li>

        <!-- Korisnicki dropdown -->
        <li nz-submenu [nzTitle]="userTitle" nzMenuClassName="user-dropdown">
          <ng-template #userTitle>
            <nz-avatar nzIcon="user" nzSize="small" style="margin-right:8px;background:#1890ff;"></nz-avatar>
            <span>{{ username }}</span>
          </ng-template>
          <ul>
            <li nz-menu-item routerLink="/account/change-password">
              <span nz-icon nzType="lock"></span>
              Promena lozinke
            </li>
            <li nz-menu-divider></li>
            <li nz-menu-item (click)="logout()" class="logout-item">
              <span nz-icon nzType="logout"></span>
              Odjavi se
            </li>
            <li nz-menu-item (click)="confirmCloseApp()" class="logout-item">
              <span nz-icon nzType="poweroff"></span>
              Zatvori aplikaciju
            </li>
          </ul>
        </li>

      </ul>
    </nz-header>
  `,
  styles: [`
    :host {
      display: block;
    }

    .navbar {
      display: flex;
      align-items: center;
      padding: 0 24px;
      background: #001529;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    .navbar-brand {
      margin-right: 40px;
      flex-shrink: 0;
    }

    .logo-text {
      color: #fff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .navbar-menu {
      flex: 1;
      display: flex;
      align-items: center;
      line-height: 64px;
      background: transparent !important;
      border-bottom: none !important;
    }

    .spacer {
      flex: 1;
      pointer-events: none;
    }

    /* Uvek vidljiv tekst stavki - bela boja u svim stanjima */
    .navbar-menu ::ng-deep .ant-menu-item,
    .navbar-menu ::ng-deep .ant-menu-submenu-title {
      color: rgba(255,255,255,0.85) !important;
    }

    .navbar-menu ::ng-deep .ant-menu-item:hover,
    .navbar-menu ::ng-deep .ant-menu-submenu:hover > .ant-menu-submenu-title,
    .navbar-menu ::ng-deep .ant-menu-item-selected,
    .navbar-menu ::ng-deep .ant-menu-submenu-selected > .ant-menu-submenu-title {
      color: #fff !important;
    }

    .navbar-menu ::ng-deep .ant-menu-item .anticon,
    .navbar-menu ::ng-deep .ant-menu-submenu-title .anticon {
      color: inherit !important;
    }

    ::ng-deep .logout-item {
      color: #ff4d4f !important;
    }

    ::ng-deep .logout-item:hover {
      background: #fff1f0 !important;
    }
  `]
})
export class NavbarComponent implements OnInit {
  username = '';
  isAdmin = false;
  isEmployee = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const role = window.localStorage.getItem('role');
      this.username = window.localStorage.getItem('fullName')
        || window.localStorage.getItem('username')
        || 'Korisnik';
      this.isAdmin = role === 'ADMIN';
      this.isEmployee = role === 'EMPLOYEE';
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    this.router.navigate(['/login']);
  }

  confirmCloseApp(): void {
    this.modal.confirm({
      nzTitle: 'Zatvoriti aplikaciju?',
      nzContent: 'Ovo će potpuno ugasiti EasyShop aplikaciju na ovom računaru. ' +
        'Svi koji trenutno rade u aplikaciji na ovom računaru biće odjavljeni.',
      nzOkText: 'Zatvori aplikaciju',
      nzOkDanger: true,
      nzCancelText: 'Odustani',
      nzOnOk: () => this.closeApp(),
    });
  }

  private closeApp(): void {
    this.http.post(`${environment.apiUrl}/api/system/shutdown`, {}).subscribe({
      next: () => this.showClosedMessage(),
      error: () => this.showClosedMessage(), // server se gasi - konekcija moze da "pukne" i pored uspeha
    });
  }

  private showClosedMessage(): void {
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;' +
      'font-family:sans-serif;font-size:20px;color:#333;background:#f5f5f5;">' +
      'Aplikacija je zatvorena. Ovaj prozor možete zatvoriti (X).</div>';
    setTimeout(() => window.close(), 800);
  }
}
