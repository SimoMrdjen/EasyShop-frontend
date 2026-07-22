import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private indirektni$ = new BehaviorSubject<string | null>(null);

  setIndirektni(value: string | null) {
    this.indirektni$.next(value);
  }

  getIndirektni() {
    return this.indirektni$.asObservable();
  }
}
