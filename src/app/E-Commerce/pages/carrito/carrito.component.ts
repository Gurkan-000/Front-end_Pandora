import { CurrencyPipe } from '@angular/common';
import {
    Component,
    DestroyRef,
    ElementRef,
    inject,
    signal,
    ViewChild
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

import { firstValueFrom } from 'rxjs';

import { loadScript } from '@paypal/paypal-js';

import { environment } from '../../../../environments/environment';

import { PasarelaPagoService } from '../../../core/services/pasarela-pago.service';

import { ResponseInicioPago } from '../../../core/interfaces/pago.interface';

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
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);

    private readonly pasarelaPagoService = inject(PasarelaPagoService);

    @ViewChild('paypalButtonContainer')
    private paypalButtonContainer?: ElementRef<HTMLDivElement>;

    private paypalRenderizado = false;

    private pedidoEnPago: ResponseInicioPago | null = null;

    readonly mostrarBotonesPayPal = signal(false);

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
        this.mostrarBotonesPayPal.set(false);

        this.paypalRenderizado = false;
        this.pedidoEnPago = null;

        this.formularioCompra.reset();

        this.mostrarModalCompra.set(true);
    }

    // Cierra la modal y actualiza el carrito después de una compra exitosa.
    cerrarModalCompra(): void {

        if (this.procesandoCompra()) {
            return;
        }

        const pedidoFueCreado = this.compraExitosa();

        this.paypalButtonContainer?.nativeElement.replaceChildren();

        this.paypalRenderizado = false;
        this.pedidoEnPago = null;

        this.mostrarModalCompra.set(false);
        this.mostrarBotonesPayPal.set(false);

        this.errorCompra.set('');
        this.compraExitosa.set(false);

        this.formularioCompra.reset();

        if (pedidoFueCreado) {
            this.cargarCarrito();
        }
    }

    private construirRequestPedido(): CrearPedidoRequest {

        const valores = this.formularioCompra.getRawValue();

        return {
            informacionAdicional: valores.informacionAdicional.trim(),
            departamentoEntrega: valores.departamentoEntrega.trim(),
            distritoEntrega: valores.distritoEntrega.trim(),
            direccionEntrega: valores.direccionEntrega.trim()
        };
    }

    iniciarPago(): void {

        if (this.procesandoCompra() || this.compraExitosa()) {
            return;
        }

        if (this.formularioCompra.invalid) {
            this.formularioCompra.markAllAsTouched();
            return;
        }

        const request = this.construirRequestPedido();

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

        this.mostrarBotonesPayPal.set(true);

        void this.renderizarBotonesPayPal();
    }


    private async renderizarBotonesPayPal(): Promise<void> {

        if (this.paypalRenderizado) {
            return;
        }

        if (
            !environment.paypalClientId ||
            environment.paypalClientId.startsWith('TU_CLIENT_ID')
        ) {
            this.errorCompra.set(
                'Configura el Client ID de PayPal antes de continuar.'
            );
            return;
        }

        try {

            const paypal = await loadScript({
                clientId: environment.paypalClientId,
                currency: 'USD',
                intent: 'capture'
            });

            if (!paypal?.Buttons || !this.paypalButtonContainer) {
                throw new Error('No se pudo inicializar PayPal.');
            }

            const buttons = paypal.Buttons({

                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal'
                },

                createOrder: async () => {

                    this.procesandoCompra.set(true);

                    try {

                        const request = this.construirRequestPedido();

                        const response = await firstValueFrom(
                            this.pasarelaPagoService.crearOrden(request)
                        );

                        if (
                            !response.idPedido ||
                            !response.idOrdenPayPal
                        ) {
                            throw new Error(
                                'El backend no devolvió los datos de la orden.'
                            );
                        }

                        this.pedidoEnPago = response;

                        return response.idOrdenPayPal;

                    } catch (error) {

                        this.manejarErrorPago(error);

                        throw error;

                    } finally {

                        this.procesandoCompra.set(false);

                    }
                },

                onApprove: async (data) => {

                    if (!this.pedidoEnPago) {
                        this.errorCompra.set(
                            'No se encontró el pedido asociado al pago.'
                        );
                        return;
                    }

                    this.procesandoCompra.set(true);

                    try {

                        const response = await firstValueFrom(
                            this.pasarelaPagoService.capturarPago({
                                idPedido: this.pedidoEnPago.idPedido,
                                idOrdenPayPal: data.orderID
                            })
                        );

                        if (response.estadoPago !== 'PROCEDE') {
                            throw new Error(
                                'El backend no confirmó el pago.'
                            );
                        }

                        this.compraExitosa.set(true);

                        this.mostrarBotonesPayPal.set(false);

                    } catch (error) {

                        this.manejarErrorPago(error);

                    } finally {

                        this.procesandoCompra.set(false);

                    }

                },

                onCancel: () => {

                    this.errorCompra.set(
                        'Cancelaste el proceso de pago. Puedes intentarlo nuevamente.'
                    );

                },

                onError: (error) => {

                    console.error('Error de PayPal:', error);

                    this.errorCompra.set(
                        'Ocurrió un problema con PayPal. Inténtalo nuevamente.'
                    );

                }

            });

            await buttons.render(
                this.paypalButtonContainer.nativeElement
            );

            this.paypalRenderizado = true;

        } catch (error) {

            console.error('Error al inicializar PayPal:', error);

            this.errorCompra.set(
                'No fue posible cargar PayPal. Recarga e inténtalo nuevamente.'
            );

        }

    }


    private manejarErrorPago(error: unknown): void {

        console.error('Error durante el pago:', error);

        const errorHttp = error as { status?: number };

        if (errorHttp.status === 401) {

            this.mostrarModalCompra.set(false);

            this.authService.limpiarSesionLocal();

            void this.router.navigate(['/login']);

            return;
        }

        this.errorCompra.set(
            'No fue posible completar el pago. Verifica tu información e inténtalo nuevamente.'
        );

    }

}