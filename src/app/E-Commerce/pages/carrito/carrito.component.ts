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

import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { PedidoService } from '../../../core/services/pedido.service';

import {
    ResponseCarrito,
    ResponseDetalleCarrito
} from '../../../core/interfaces/carrito.interface';

import { CrearPedidoRequest } from '../../../core/interfaces/crear-pedido.interface';

import { ConfirmationDialogComponent } from '../../../ERP/shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [
        CurrencyPipe,
        RouterLink,
        ReactiveFormsModule,
        ConfirmationDialogComponent
    ],
    templateUrl: './carrito.component.html',
    styleUrl: './carrito.component.css'
})
export class CarritoComponent {

    private readonly authService = inject(AuthService);
    private readonly carritoService = inject(CarritoService);
    private readonly pedidoService = inject(PedidoService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);

    readonly carrito = signal<ResponseCarrito | null>(null);

    readonly cargando = signal(true);

    readonly eliminandoId = signal<string | null>(null);

    readonly error = signal('');

    readonly mostrarConfirmacionVaciar = signal(false);
    readonly vaciandoCarrito = signal(false);

    // Estados del procesamiento de compra.
    readonly mostrarModalCompra = signal(false);
    readonly procesandoCompra = signal(false);
    readonly errorCompra = signal('');
    readonly compraExitosa = signal(false);
    
    readonly formularioCompra = this.fb.nonNullable.group({
        informacionAdicional: ['', [
            Validators.required,
            Validators.pattern(/\S/)
        ]],
        departamentoEntrega: ['', [
            Validators.required,
            Validators.maxLength(40),
            Validators.pattern(/\S/)
        ]],
        distritoEntrega: ['', [
            Validators.required,
            Validators.maxLength(40),
            Validators.pattern(/\S/)
        ]],
        direccionEntrega: ['', [
            Validators.required,
            Validators.maxLength(255),
            Validators.pattern(/\S/)
        ]]
    });

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

    // Abre la modal de procesamiento de compra.
    abrirModalCompra(): void {

        if (
            !this.carrito()?.detallesCarrito.length ||
            this.procesandoCompra()
        ) {
            return;
        }

        this.errorCompra.set('');
        this.compraExitosa.set(false);
        this.formularioCompra.reset();

        this.mostrarModalCompra.set(true);

    }

    // Cierra la modal y actualiza el carrito después de una compra exitosa.
    cerrarModalCompra(): void {

        if (this.procesandoCompra()) {
            return;
        }

        const pedidoFueCreado = this.compraExitosa();

        this.mostrarModalCompra.set(false);
        this.errorCompra.set('');
        this.compraExitosa.set(false);
        this.formularioCompra.reset();

        if (pedidoFueCreado) {
            this.cargarCarrito();
        }

    }

    confirmarCompra(): void {

        if (this.procesandoCompra() || this.compraExitosa()) {
            return;
        }

        if (this.formularioCompra.invalid) {
            this.formularioCompra.markAllAsTouched();
            return;
        }

        const valores = this.formularioCompra.getRawValue();

        // Evitamos enviar campos que contengan solamente espacios.
        const request: CrearPedidoRequest = {
            informacionAdicional: valores.informacionAdicional.trim(),
            departamentoEntrega: valores.departamentoEntrega.trim(),
            distritoEntrega: valores.distritoEntrega.trim(),
            direccionEntrega: valores.direccionEntrega.trim()
        };

        if (
            !request.informacionAdicional ||
            !request.departamentoEntrega ||
            !request.distritoEntrega ||
            !request.direccionEntrega
        ) {
            this.formularioCompra.markAllAsTouched();
            return;
        }

        this.errorCompra.set('');
        this.procesandoCompra.set(true);

        this.pedidoService.crearPedido(request).pipe(

            finalize(() => this.procesandoCompra.set(false)),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe({

            next: () => {
                this.compraExitosa.set(true);
            },

            error: error => {

                console.error('Error al procesar la compra:', error);

                if (error.status === 401) {
                    this.mostrarModalCompra.set(false);
                    this.authService.limpiarSesionLocal();
                    void this.router.navigate(['/login']);
                    return;
                }

                this.errorCompra.set(
                    error.status === 400
                        ? 'Verifica los datos de entrega e inténtalo nuevamente.'
                        : 'No fue posible procesar tu compra. Inténtalo nuevamente.'
                );

            }

        });

    }

}