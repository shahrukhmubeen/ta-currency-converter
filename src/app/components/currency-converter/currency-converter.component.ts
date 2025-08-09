import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-currency-converter',
  templateUrl: './currency-converter.component.html',
  styleUrls: ['./currency-converter.component.scss']
})
export class CurrencyConverterComponent implements OnInit {
  converterForm: FormGroup;
  currencies: string[] = [];
  result: number | null = null;
  amount: number = 0;
  fromCurrency: string = '';
  toCurrency: string = '';
  history: any[] = [];
  loading: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private currencyService: CurrencyService
  ) {
    this.converterForm = this.fb.group({
      fromCurrency: ['', Validators.required],
      toCurrency: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.getCurrencies();
    this.getConversionHistory();
  }

  getCurrencies(): void {
    this.currencyService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
        // Set default values
        if (currencies.length > 0) {
          this.converterForm.patchValue({
            fromCurrency: currencies[0],
            toCurrency: currencies[1]
          });
        }
      },
      error: (error) => console.error('Error fetching currencies:', error)
    });
  }

  onConvert(): void {
    if (this.converterForm.valid) {
      const { fromCurrency, toCurrency, amount } = this.converterForm.value;
      this.loading = true;

      this.currencyService.convertCurrency(fromCurrency, toCurrency, amount).subscribe({
        next: (result) => {
          this.result = result;
          this.amount = amount;
          this.fromCurrency = fromCurrency;
          this.toCurrency = toCurrency;
          this.loading = false;
          // Refresh history after successful conversion
          this.getConversionHistory();
        },
        error: (error) => {
          console.error('Error converting currency:', error);
          this.loading = false;
        }
      });
    }
  }

  getConversionHistory(): void {
    this.currencyService.getConversionHistory().subscribe({
      next: (history) => {
        this.history = history;
      },
      error: (error) => console.error('Error fetching history:', error)
    });
  }
}
