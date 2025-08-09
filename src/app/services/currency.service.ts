import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface CurrencyResponse {
  data: Record<string, string>;
}

interface ConversionResponse {
  result: number;
}

interface ConversionHistory {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private apiUrl = environment.apiUrl;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCurrencies(): Observable<string[]> {
    return this.http.get<CurrencyResponse>(`${this.apiUrl}/currencies`)
      .pipe(
        map(response => Object.keys(response.data)),
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  convertCurrency(from: string, to: string, amount: number): Observable<number> {
    this.loadingSubject.next(true);
    return this.http.post<ConversionResponse>(
      `${this.apiUrl}/convert`,
      { from, to, amount }
    ).pipe(
      map(response => response.result),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  getConversionHistory(): Observable<ConversionHistory[]> {
    return this.http.get<ConversionHistory[]>(`${this.apiUrl}/history`);
  }
}
