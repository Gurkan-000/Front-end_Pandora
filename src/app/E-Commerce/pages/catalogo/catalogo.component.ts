
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductApiService } from '../../../core/services/product-api.service';
import { Product } from './product.interface';
import { ProductCardComponent } from './product-card.component';

type ProductSort = 'recommended' | 'price-asc' | 'price-desc';

@Component({
    selector: 'app-catalogo',
    imports: [NgOptimizedImage, ProductCardComponent],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent implements OnInit {

    private readonly productApi = inject(ProductApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    protected readonly products = signal<Product[]>([]);
    protected readonly loading = signal(true);
    protected readonly loadError = signal('');

    protected readonly searchTerm = signal('');
    protected readonly selectedCategory = signal('Todas');

    protected readonly sortOrder = signal<ProductSort>('recommended');
    protected readonly favorites = signal<string[]>([]);

    constructor() {

        this.route.queryParamMap
            .pipe(takeUntilDestroyed())
            .subscribe((params) => {

                this.searchTerm.set(params.get('q') ?? '');

            });

    }

    ngOnInit(): void {

        this.loadProducts();

    }

    protected loadProducts(): void {

        this.loading.set(true);
        this.loadError.set('');

        this.productApi.getProducts().pipe(

            finalize(() => this.loading.set(false))

        ).subscribe({

            next: (products) => {

                this.products.set(

                    products.filter(product =>
                        product.cantidadVariantes > 0
                    )

                );

            },

            error: (error: unknown) => {

                console.error(
                    'Error al cargar productos de la tienda:',
                    error
                );

                this.loadError.set(
                    'No fue posible cargar los productos. Inténtalo nuevamente.'
                );

            }

        });

    }

    protected readonly categories = computed(() => [

        'Todas',

        ...new Set(
            this.products().map(product => product.nombreCategoria)
        )

    ]);

    protected readonly filteredProducts = computed(() => {

        const term = this.searchTerm()
            .trim()
            .toLocaleLowerCase('es');

        const selectedCategory = this.selectedCategory();

        const matches = this.products().filter(product => {

            const matchesTerm = !term || [

                product.nombreProducto,
                product.nombreMarca,
                product.nombreCategoria,
                product.nombreSubcategoria

            ].some(value =>

                value.toLocaleLowerCase('es').includes(term)

            );

            return matchesTerm
                && (
                    selectedCategory === 'Todas'
                    || product.nombreCategoria === selectedCategory
                );

        });

        return [...matches].sort((first, second) => {

            switch (this.sortOrder()) {

                case 'price-asc':
                    return first.precio - second.precio;

                case 'price-desc':
                    return second.precio - first.precio;

                default:
                    return 0;

            }

        });

    });

    protected setSearchTerm(event: Event): void {

        this.searchTerm.set(
            (event.target as HTMLInputElement).value
        );

    }

    protected setSortOrder(event: Event): void {

        this.sortOrder.set(
            (event.target as HTMLSelectElement).value as ProductSort
        );

    }

    protected selectCategory(category: string): void {

        this.selectedCategory.set(category);

    }

    protected toggleFavorite(productId: string): void {

        this.favorites.update(current =>

            current.includes(productId)

                ? current.filter(id => id !== productId)

                : [...current, productId]

        );

    }

    protected verProducto(idProducto: string): void {

        void this.router.navigate([
            '/productos',
            idProducto
        ]);

    }

}
