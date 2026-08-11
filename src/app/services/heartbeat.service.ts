import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Šalje redovan signal backend-u dok god je ova stranica otvorena u browseru
 * (i pre i posle prijave). Ako backend prestane da prima ovaj signal (jer je
 * korisnik zatvorio prozor), sam se gasi - videti HeartbeatMonitorService na
 * backend-u. Ovo je nezavisno od praćenja OS procesa browsera, koje samo po
 * sebi nije pouzdano (Chrome može da ostane "živ" u pozadini i posle
 * zatvaranja svih prozora).
 */
@Injectable({ providedIn: 'root' })
export class HeartbeatService {
  private readonly url = `${environment.apiUrl}/api/system/heartbeat`;
  private readonly intervalMs = 10_000;

  constructor(private http: HttpClient) {
    if (typeof window === 'undefined') return; // SSR - nema smisla slati heartbeat
    this.send();
    setInterval(() => this.send(), this.intervalMs);
  }

  private send(): void {
    this.http.post(this.url, {}).subscribe({ error: () => {} });
  }
}
