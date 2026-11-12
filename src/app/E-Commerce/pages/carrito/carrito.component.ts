
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
import {
    ResponseCarrito,
    ResponseDetalleCarrito
} from '../../../core/interfaces/carrito.interface';

import { ConfirmationDialogComponent } from '../../../ERP/shared/confirmation-dialog/confirmation-dialog.component'

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [
        CurrencyPipe,
        RouterLink,
        ConfirmationDialogComponent
    ],
    templateUrl: './carrito.component.html',
    styleUrl: './carrito.component.css'
})
export class CarritoComponent {

    private readonly authService = inject(AuthService);
    private readonly carritoService = inject(CarritoService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly carrito = signal<ResponseCarrito | null>(null);

    readonly cargando = signal(true);

    readonly eliminandoId = signal<string | null>(null);

    readonly error = signal('');

    readonly mostrarConfirmacionVaciar = signal(false);
    readonly vaciandoCarrito = signal(false);

    constructor() {

        // El guard ya validó la sesión y actualizó el usuario actual.
        const usuario = this.authService.usuarioActual();

        if (!usuario) {

            void this.router.navigate(['/login']);

            this.cargando.set(false);

            return;
        }

        // El carrito se consulta solamente al entrar a esta página.
        this.cargarCarrito();

    }

    protected cargarCarrito(): void {

        this.cargando.set(true);
        this.error.set('');

        this.carritoService.obtenerCarrito().pipe(

            finalize(() => this.cargando.set(false)),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe({

            next: carrito => {
                this.carrito.set(carrito);
            },

            error: error => {

                console.error('Error al consultar el carrito:', error);

                if (error.status === 401) {
                    this.authService.limpiarSesionLocal();
                    void this.router.navigate(['/login']);
                    return;
                }

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
                this.carritoService.obtenerCarrito()
            ),

            finalize(() => this.eliminandoId.set(null)),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe({

            next: carritoActualizado => {
                this.carrito.set(carritoActualizado);
            },

            error: error => {

                console.error('Error al quitar el producto:', error);

                if (error.status === 401) {
                    this.authService.limpiarSesionLocal();
                    void this.router.navigate(['/login']);
                    return;
                }

                this.error.set(
                    'No fue posible actualizar tu carrito. Inténtalo nuevamente.'
                );

            }

        });

    }

    abrirConfirmacionVaciar(): void {
        if (
            !this.carrito()?.detallesCarrito.length ||
            this.vaciandoCarrito()
        ) {
            return;
        }

        this.mostrarConfirmacionVaciar.set(true);
    }

    cerrarConfirmacionVaciar(): void {
        if (this.vaciandoCarrito()) {
            return;
        }

        this.mostrarConfirmacionVaciar.set(false);
    }

    confirmarVaciarCarrito(): void {
        const carritoActual = this.carrito();

        if (
            !carritoActual ||
            carritoActual.detallesCarrito.length === 0 ||
            this.vaciandoCarrito()
        ) {
            return;
        }

        this.error.set('');
        this.vaciandoCarrito.set(true);

        this.carritoService.vaciarCarrito(carritoActual.idCarrito).pipe(
            finalize(() => this.vaciandoCarrito.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                // Actualizamos la vista sin volver a consultar el backend.
                this.carrito.update(actual => actual ? {
                    ...actual,
                    detallesCarrito: [],
                    precioTotal: 0,
                    cantidadProductos: 0
                } : actual);

                this.mostrarConfirmacionVaciar.set(false);
            },
            error: error => {
                console.error('Error al vaciar el carrito:', error);

                if (error.status === 401) {
                    this.mostrarConfirmacionVaciar.set(false);
                    this.authService.limpiarSesionLocal();
                    void this.router.navigate(['/login']);
                    return;
                }

                this.error.set(
                    'No fue posible vaciar tu carrito. Inténtalo nuevamente.'
                );
            }
        });
    }

}
