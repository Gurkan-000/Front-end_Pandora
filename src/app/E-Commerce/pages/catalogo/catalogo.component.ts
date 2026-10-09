import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ProductApiService } from '../../../core/services/product-api.service';
import { Product } from './product.interface';
import { ProductCardComponent } from './product-card.component';

type ProductSort = 'recommended' | 'price-asc' | 'price-desc' | 'rating';

@Component({
    selector: 'app-catalogo',
    imports: [NgOptimizedImage, ProductCardComponent],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent {
    private readonly productApi = inject(ProductApiService);
    private readonly route = inject(ActivatedRoute);

    protected readonly products = toSignal(this.productApi.getProducts(), { initialValue: [] });
    protected readonly searchTerm = signal('');
    protected readonly selectedCategory = signal('Todas');
    protected readonly onlyInStock = signal(false);
    protected readonly sortOrder = signal<ProductSort>('recommended');
    protected readonly favorites = signal<string[]>([]);

    constructor() {
        this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
            this.searchTerm.set(params.get('q') ?? '');
        });
    }
    protected readonly categories = computed(() => [
        'Todas',
        ...new Set(this.products().map((product) => product.nombreCategoria))
    ]);
    protected readonly filteredProducts = computed(() => {
        const term = this.searchTerm().trim().toLocaleLowerCase('es');
        const selectedCategory = this.selectedCategory();
        const matches = this.products().filter((product) => {
            const matchesTerm = !term || [
                product.nombreProducto,
                product.nombreMarca,
                product.nombreCategoria,
                product.nombreSubcategoria
            ].some((value) => value.toLocaleLowerCase('es').includes(term));

            return matchesTerm
                && (selectedCategory === 'Todas' || product.nombreCategoria === selectedCategory)
                && (!this.onlyInStock() || product.stock > 0);
        });

        return [...matches].sort((first, second) => {
            switch (this.sortOrder()) {
                case 'price-asc':
                    return first.precio - second.precio;
                case 'price-desc':
                    return second.precio - first.precio;
                case 'rating':
                    return (second.rating ?? 0) - (first.rating ?? 0);
                default:
                    return 0;
            }
        });
    });

    protected setSearchTerm(event: Event): void {
        this.searchTerm.set((event.target as HTMLInputElement).value);
    }

    protected setSortOrder(event: Event): void {
        this.sortOrder.set((event.target as HTMLSelectElement).value as ProductSort);
    }

    protected toggleAvailability(event: Event): void {
        this.onlyInStock.set((event.target as HTMLInputElement).checked);
    }

    protected selectCategory(category: string): void {
        this.selectedCategory.set(category);
    }

    protected toggleFavorite(productId: string): void {
        this.favorites.update((current) => current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId]);
    }

    protected addToCart(product: Product): void {
        if (product.stock > 0) {
            this.productApi.addToCart();
        }
    }
}