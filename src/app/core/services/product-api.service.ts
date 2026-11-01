import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';

import {
    Product,
    ProductApiResponse,
    ProductSubcategoryResponse,
    ProductVariantResponse
} from '../../E-Commerce/pages/catalogo/product.interface';

@Injectable({
    providedIn: 'root'
})
export class ProductApiService {
    private readonly http = inject(HttpClient);
    private readonly backendUrl = 'http://localhost:8080';
    private readonly apiUrl = `${this.backendUrl}/api`;

    readonly cartCount = signal(0);

    getProducts(): Observable<Product[]> {
        return forkJoin({
            products: this.http.get<ProductApiResponse[]>(
                `${this.apiUrl}/producto/listar`
            ),
            subcategories: this.http.get<ProductSubcategoryResponse[]>(
                `${this.apiUrl}/subcategoria/listar`
            )
        }).pipe(
            switchMap(({ products, subcategories }) => {
                const categoryBySubcategory = new Map(
                    subcategories.map((subcategory) => [
                        subcategory.idSubCategoria,
                        subcategory.nombreCategoria
                    ])
                );

                return forkJoin(products.map((product) =>
                    this.http.get<ProductVariantResponse[]>(
                        `${this.apiUrl}/producto/listar/${encodeURIComponent(product.idProducto)}/variantes`
                    ).pipe(
                        map((variants) => this.toStoreProduct(
                            product,
                            categoryBySubcategory.get(product.idSubCategoria) ?? product.nombreSubcategoria,
                            variants
                        ))
                    )
                ));
            })
        );
    }

    private toStoreProduct(
        product: ProductApiResponse,
        nombreCategoria: string,
        variants: ProductVariantResponse[]
    ): Product {
        return {
            idProducto: product.idProducto,
            nombreProducto: product.nombreProducto,
            descripcion: product.descripcion,
            nombreMarca: product.nombreMarca,
            nombreCategoria,
            nombreSubcategoria: product.nombreSubcategoria,
            precio: product.precio,
            urlImagen: new URL(product.urlImagen, this.backendUrl).toString(),
            stock: variants.reduce((total, variant) => total + variant.stock, 0)
        };
    }

    addToCart(): void {
        this.cartCount.update((count) => count + 1);
    }
}