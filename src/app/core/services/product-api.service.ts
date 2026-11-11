
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

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

    getProducts(): Observable<Product[]> {

        return forkJoin({

            products: this.http.get<ProductApiResponse[]>(
                `${this.apiUrl}/producto/listar`
            ),

            subcategories: this.http.get<ProductSubcategoryResponse[]>(
                `${this.apiUrl}/subcategoria/listar`
            )

        }).pipe(

            map(({ products, subcategories }) => {

                const categoryBySubcategory = new Map(
                    subcategories.map((subcategory) => [
                        subcategory.idSubCategoria,
                        subcategory.nombreCategoria
                    ])
                );

                return products.map((product): Product => ({

                    idProducto: product.idProducto,
                    nombreProducto: product.nombreProducto,
                    descripcion: product.descripcion,
                    nombreMarca: product.nombreMarca,

                    nombreCategoria:
                        categoryBySubcategory.get(product.idSubCategoria)
                        ?? product.nombreSubcategoria,

                    nombreSubcategoria: product.nombreSubcategoria,

                    precio: product.precio,

                    urlImagen:
                        this.resolverUrlImagen(product.urlImagen) ?? '',

                    cantidadVariantes: product.cantidadVariantes

                }));

            })

        );

    }

    getProductById(idProducto: string): Observable<Product | null> {

        return this.getProducts().pipe(

            map(products =>
                products.find(product =>
                    product.idProducto === idProducto
                ) ?? null
            )

        );

    }

    getProductVariants(
        idProducto: string
    ): Observable<ProductVariantResponse[]> {

        return this.http.get<ProductVariantResponse[]>(

            `${this.apiUrl}/producto/listar/${encodeURIComponent(idProducto)}/variantes`

        ).pipe(

            map(variants => variants.map(variant => ({

                ...variant,

                urlImagen: this.resolverUrlImagen(variant.urlImagen)

            })))

        );

    }

    private resolverUrlImagen(
        urlImagen: string | null
    ): string | null {

        if (!urlImagen) {
            return null;
        }

        return new URL(urlImagen, this.backendUrl).toString();

    }

}
