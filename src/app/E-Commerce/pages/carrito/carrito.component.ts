

import { CurrencyPipe } from '@angular/common';
import {
    Component,
    DestroyRef,
    inject,
    signal
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { ResponseCarrito, ResponseDetalleCarrito } from '../../../core/interfaces/carrito.interface';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [
        CurrencyPipe,
        RouterLink
    ],
    templateUrl: './carrito.component.html',
    styleUrl: './carrito.component.css'
})
export class CarritoComponent {

    private readonly authService = inject(AuthService);
    private readonly carritoService = inject(CarritoService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private correoUsuario = '';

    readonly carrito = signal<ResponseCarrito | null>(null);

    readonly cargando = signal(true);

    readonly eliminandoId = signal<string | null>(null);

    readonly error = signal('');

    constructor() {

        // El guard ya validó la sesión y actualizó el usuario actual.
        const usuario = this.authService.usuarioActual();

        if (!usuario?.correo) {

            void this.router.navigate(['/login']);

            this.cargando.set(false);

            return;
        }

        this.correoUsuario = usuario.correo;

        // El carrito se consulta solamente al entrar a esta página.
        this.cargarCarrito();

    }

    protected  cargarCarrito(): void {

        this.cargando.set(true);
        this.error.set('');

        this.carritoService.obtenerCarrito(this.correoUsuario).pipe(

            finalize(() => this.cargando.set(false)),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe({

            next: carrito => {
                this.carrito.set(carrito);
            },

            error: error => {

                console.error('Error al consultar el carrito:', error);

                this.error.set(
                    'No fue posible cargar tu carrito. Inténtalo nuevamente.'
                );

            }

        });

    }

    quitarProducto(detalle: ResponseDetalleCarrito): void {

        if (this.eliminandoId()) {
            return;
        }

        this.error.set('');

        this.eliminandoId.set(detalle.idDetalleCarrito);

        this.carritoService.quitarDetalle(
            detalle.idDetalleCarrito
        ).pipe(

            // Después de eliminar, volvemos a consultar el carrito.
            switchMap(() =>
                this.carritoService.obtenerCarrito(this.correoUsuario)
            ),

            finalize(() => this.eliminandoId.set(null)),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe({

            next: carritoActualizado => {
                this.carrito.set(carritoActualizado);
            },

            error: error => {

                console.error('Error al quitar el producto:', error);

                this.error.set(
                    'No fue posible actualizar tu carrito. Inténtalo nuevamente.'
                );

            }

        });

    }

}
