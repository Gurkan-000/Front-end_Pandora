import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

import { Product } from '../../E-Commerce/pages/catalogo/product.interface';
import { MOCK_PRODUCTS } from '../../E-Commerce/pages/catalogo/products.mock';

@Injectable({
    providedIn: 'root'
})
export class ProductApiService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/productos';
    private readonly useMockData = true;

    readonly cartCount = signal(0);

    getProducts(): Observable<Product[]> {
        if (this.useMockData) {
            return of(MOCK_PRODUCTS);
        }

        return this.http.get<Product[]>(this.apiUrl).pipe(
            catchError(() => of(MOCK_PRODUCTS))
        );
    }

    addToCart(): void {
        this.cartCount.update((count) => count + 1);
    }
}