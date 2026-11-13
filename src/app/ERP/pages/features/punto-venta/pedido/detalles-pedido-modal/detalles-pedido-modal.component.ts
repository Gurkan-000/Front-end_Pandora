import {
    Component,
    inject,
    input,
    output,
    OnInit,
    signal
} from '@angular/core';
import { CurrencyPipe} from '@angular/common';
import { finalize } from 'rxjs';

import { PedidoERPService } from '../../../../../services/pedido-erp.service';
import { ResponsePedidoDetalleERP } from '../../../../../interfaces/response-detalle-pedido-erp.interface';
import { ConfirmationDialogComponent } from '../../../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-detalles-pedido-modal-erp',
    standalone: true,
    imports: [
        CurrencyPipe,
        ConfirmationDialogComponent
    ],
    templateUrl: './detalles-pedido-modal.component.html',
    styleUrl: './detalles-pedido-modal.component.css'
})
export class DetallesPedidoModalERPComponent implements OnInit {

    private readonly pedidoService = inject(PedidoERPService);

    readonly idPedido = input.required<string>();
    readonly estadoInicial = input.required<string>();

    readonly cerrar = output<void>();
    readonly estadoActualizado = output<string>();

    readonly pedido = signal<ResponsePedidoDetalleERP | null>(null);

    readonly cargando = signal(false);
    readonly error = signal('');

    readonly mostrarConfirmacion = signal(false);
    readonly actualizandoEstado = signal(false);

    readonly siguienteEstado = signal('');
    readonly errorEstado = signal('');

    ngOnInit(): void {
        this.cargarDetalles();
    }

    cargarDetalles(): void {
        this.cargando.set(true);
        this.error.set('');

        this.pedidoService.listarDetallesPedido(this.idPedido())
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: respuesta => {
                    this.pedido.set(respuesta);
                },
                error: error => {
                    console.error('Error al cargar los detalles del pedido:', error);

                    this.error.set(
                        'No fue posible cargar los detalles del pedido.'
                    );
                }
            });
    }

    prepararCambioEstado(): void {
        const estado = this.pedido()?.estadoPedido ?? this.estadoInicial();

        if (estado === 'PENDIENTE') {
            this.siguienteEstado.set('ENVIADO');
        } else if (estado === 'ENVIADO') {
            this.siguienteEstado.set('ENTREGADO');
        } else {
            return;
        }

        this.errorEstado.set('');
        this.mostrarConfirmacion.set(true);
    }

    confirmarCambioEstado(): void {
        if (this.actualizandoEstado()) {
            return;
        }

        const estadoActual = this.pedido()?.estadoPedido ?? this.estadoInicial();

        this.actualizandoEstado.set(true);
        this.errorEstado.set('');

        const peticion = estadoActual === 'PENDIENTE'
            ? this.pedidoService.enviarPedido(this.idPedido())
            : this.pedidoService.entregarPedido(this.idPedido());

        peticion
            .pipe(
                finalize(() => this.actualizandoEstado.set(false))
            )
            .subscribe({
                next: () => {
                    const nuevoEstado = this.siguienteEstado();

                    this.pedido.update(actual => {
                        if (!actual) {
                            return actual;
                        }

                        return {
                            ...actual,
                            estadoPedido: nuevoEstado
                        };
                    });

                    this.estadoActualizado.emit(nuevoEstado);
                    this.mostrarConfirmacion.set(false);
                },
                error: error => {
                    console.error('Error al actualizar el estado del pedido:', error);

                    this.mostrarConfirmacion.set(false);

                    this.errorEstado.set(
                        'No fue posible actualizar el estado del pedido. Inténtalo nuevamente.'
                    );
                }
            });
    }

    cancelarCambioEstado(): void {
        if (this.actualizandoEstado()) {
            return;
        }

        this.mostrarConfirmacion.set(false);
        this.errorEstado.set('');
    }

    cerrarModal(): void {
        if (this.actualizandoEstado()) {
            return;
        }

        this.cerrar.emit();
    }
}