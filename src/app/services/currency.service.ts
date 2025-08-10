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
  exchangeRate: number;
  timestamp: string;
}

interface ConversionHistory {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  exchangeRate: number;
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

  convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Observable<number> {
    this.loadingSubject.next(true);
    
    return this.http.post<ConversionResponse>(`${this.apiUrl}/convert`, {
      from: fromCurrency,
      to: toCurrency,
      amount: amount
    }).pipe(
      map(response => {
        // Save to localStorage
        this.saveConversionToHistory({
          fromCurrency,
          toCurrency,
          amount,
          result: response.result,
          exchangeRate: response.exchangeRate,
          timestamp: response.timestamp
        });
        
        return response.result;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  getConversionHistory(): Observable<ConversionHistory[]> {
    // Get history from localStorage instead of backend
    const history = this.getHistoryFromLocalStorage();
    return new Observable(observer => {
      observer.next(history);
      observer.complete();
    });
  }

  private saveConversionToHistory(conversion: ConversionHistory): void {
    const history = this.getHistoryFromLocalStorage();
    
    // Add new conversion to the beginning of the array
    history.unshift(conversion);
    
    // Keep only the last 10 conversions
    const limitedHistory = history.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('conversionHistory', JSON.stringify(limitedHistory));
  }

  private getHistoryFromLocalStorage(): ConversionHistory[] {
    try {
      const historyJson = localStorage.getItem('conversionHistory');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error parsing conversion history from localStorage:', error);
      return [];
    }
  }

  clearHistory(): void {
    localStorage.removeItem('conversionHistory');
  }
}
