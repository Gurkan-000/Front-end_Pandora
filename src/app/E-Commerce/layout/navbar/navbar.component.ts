import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ProductApiService } from '../../../core/services/product-api.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {
    private readonly router = inject(Router);
    protected readonly cartCount = inject(ProductApiService).cartCount;
    protected readonly menuOpen = signal(false);
    protected readonly searchTerm = signal('');

    protected updateSearch(event: Event): void {
        this.searchTerm.set((event.target as HTMLInputElement).value);
    }

    protected submitSearch(event: Event): void {
        event.preventDefault();
        void this.router.navigate(['/productos'], {
            queryParams: { q: this.searchTerm().trim() || null }
        });
    }

    protected toggleMenu(): void {
        this.menuOpen.update((open) => !open);
    }

    protected closeMenu(): void {
        this.menuOpen.set(false);
    }
}