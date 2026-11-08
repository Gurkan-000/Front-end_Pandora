import {
    Component,
    HostListener,
    computed,
    inject,
    signal
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { ProductApiService } from '../../../core/services/product-api.service';
import { AuthService } from '../../../core/services/auth.service';

import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {

    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    protected readonly cartCount = inject(ProductApiService).cartCount;

    protected readonly usuarioActual = this.authService.usuarioActual;

    protected readonly menuOpen = signal(false);

    protected readonly perfilMenuAbierto = signal(false);

    protected readonly errorCerrarSesion = signal('');

    protected readonly searchTerm = signal('');

    // Obtiene las iniciales del usuario autenticado.
    protected readonly inicialesUsuario = computed(() => {

        const usuario = this.usuarioActual();

        if (!usuario) {
            return '';
        }

        const partesNombre = [
            usuario.nombre,
            usuario.apellido
        ]
            .filter((parte): parte is string => !!parte?.trim())
            .flatMap(parte => parte.trim().split(/\s+/));

        if (partesNombre.length > 0) {
            return partesNombre
                .slice(0, 2)
                .map(parte => parte.charAt(0).toUpperCase())
                .join('');
        }

        return usuario.correo?.charAt(0).toUpperCase() ?? 'U';
    });

    // Nombre que aparecerá dentro del menú de perfil.
    protected readonly nombreUsuario = computed(() => {

        const usuario = this.usuarioActual();

        if (!usuario) {
            return 'Usuario';
        }

        const nombreCompleto = [
            usuario.nombre,
            usuario.apellido
        ]
            .filter(Boolean)
            .join(' ')
            .trim();

        return nombreCompleto || usuario.correo || 'Usuario';
    });

    constructor() {

        // Recuperar la sesión al cargar o recargar el E-Commerce.
        this.authService.obtenerSesion().pipe(
            catchError(() => {
                this.authService.limpiarSesionLocal();
                return of(null);
            })
        ).subscribe();

    }

    protected updateSearch(event: Event): void {

        this.searchTerm.set(
            (event.target as HTMLInputElement).value
        );
    }

    protected submitSearch(event: Event): void {

        event.preventDefault();

        void this.router.navigate(['/productos'], {
            queryParams: {
                q: this.searchTerm().trim() || null
            }
        });
    }

    protected toggleMenu(): void {

        this.menuOpen.update(open => !open);
    }

    protected closeMenu(): void {

        this.menuOpen.set(false);
    }

    protected togglePerfilMenu(): void {

        this.errorCerrarSesion.set('');

        this.perfilMenuAbierto.update(open => !open);
    }

    protected irAlLogin(): void {

        this.perfilMenuAbierto.set(false);

        void this.router.navigate(['/login']);
    }

    protected mostrarPedidos(): void {

        this.perfilMenuAbierto.set(false);

        void this.router.navigate(['/productos/mis-pedidos']);
    }

    protected abrirCarrito(): void {

        void this.router.navigate(['/productos/carrito']);
    }

    protected cerrarSesion(): void {

        this.errorCerrarSesion.set('');

        this.authService.cerrarSesion().subscribe({

            next: () => {

                this.perfilMenuAbierto.set(false);

                void this.router.navigate(['/productos']);
            },

            error: (error) => {

                console.error('Error al cerrar sesión:', error);

                this.errorCerrarSesion.set(
                    'No se pudo cerrar la sesión. Inténtalo nuevamente.'
                );
            }

        });
    }

    // Cerrar el menú cuando se hace clic fuera del perfil.
    @HostListener('document:click', ['$event'])
    protected cerrarMenuAlHacerClickFuera(event: MouseEvent): void {

        const objetivo = event.target;

        if (
            objetivo instanceof Element &&
            !objetivo.closest('.account-area')
        ) {
            this.perfilMenuAbierto.set(false);
        }
    }

    // También se puede cerrar con Escape.
    @HostListener('document:keydown.escape')
    protected cerrarMenuConEscape(): void {

        this.perfilMenuAbierto.set(false);
    }
}