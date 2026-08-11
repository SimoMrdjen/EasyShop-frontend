import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './navbar/navbar.component';
import { HeartbeatService } from './services/heartbeat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  showNavbar = false;

  private readonly publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  private readonly printRoutes = ['/print'];

  constructor(private router: Router, private heartbeat: HeartbeatService) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects.split('?')[0];
      const isPublic = this.publicRoutes.some(r => url.startsWith(r));
      const isPrint = this.printRoutes.some(r => url.includes(r));
      this.showNavbar = !isPublic && !isPrint;
    });
  }
}
