
import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../../core/services/pedido.service';
import { ResponsePedidoCliente } from '../../../core/interfaces/response-pedido-cliente.interface';
import { ResponsePedidoDetalle } from '../../../core/interfaces/response-detalle-pedido.interface';

@Component({
    selector: 'app-mis-pedidos',
    standalone: true,
    imports: [
        CurrencyPipe,
        RouterLink
    ],
    templateUrl: './mis-pedidos.component.html',
    styleUrl: './mis-pedidos.component.css'
})
export class MisPedidosComponent implements OnInit {

    private readonly pedidoService = inject(PedidoService);

    readonly pedidos = signal<ResponsePedidoCliente[]>([]);
    readonly cargando = signal(false);
    readonly error = signal('');

    readonly pedidoDetalle = signal<ResponsePedidoDetalle | null>(null);
    readonly pedidoSeleccionado = signal<ResponsePedidoCliente | null>(null);

    readonly mostrarModalDetalles = signal(false);
    readonly cargandoDetalles = signal(false);
    readonly errorDetalles = signal('');

    ngOnInit(): void {
        this.cargarPedidos();
    }

    verDetalles(pedido: ResponsePedidoCliente): void {
        if (this.cargandoDetalles()) return;

        this.pedidoSeleccionado.set(pedido);
        this.pedidoDetalle.set(null);
        this.errorDetalles.set('');
        this.mostrarModalDetalles.set(true);

        this.cargarDetallesPedido(pedido.idPedido);
    }

    cargarPedidos(): void {
        if (this.cargando()) {
            return;
        }

        this.cargando.set(true);
        this.error.set('');

        this.pedidoService.listarPedidosCliente()
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: respuesta => {
                    this.pedidos.set(respuesta ?? []);
                },
                error: (error: HttpErrorResponse) => {
                    console.error('Error al cargar los pedidos:', error);

                    if (error.status === 401 || error.status === 403) {
                        this.error.set(
                            'Tu sesión no es válida. Inicia sesión nuevamente para consultar tus pedidos.'
                        );
                        return;
                    }

                    this.error.set(
                        'No fue posible cargar tus pedidos. Inténtalo nuevamente.'
                    );
                }
            });
    }

    obtenerClaseEstado(estado: string): string {
        const estados: Record<string, string> = {
            PENDIENTE: 'status-pendiente',
            CONFIRMADO: 'status-confirmado',
            EN_PREPARACION: 'status-preparacion',
            PREPARANDO: 'status-preparacion',
            ENVIADO: 'status-enviado',
            ENTREGADO: 'status-entregado',
            CANCELADO: 'status-cancelado'
        };

        return estados[estado?.toUpperCase()] ?? 'status-default';
    }

    private cargarDetallesPedido(idPedido: string): void {
        this.cargandoDetalles.set(true);
        this.errorDetalles.set('');

        this.pedidoService.listarDetallesPedido(idPedido)
            .pipe(
                finalize(() => this.cargandoDetalles.set(false))
            )
            .subscribe({
                next: respuesta => {
                    this.pedidoDetalle.set(respuesta);
                },
                error: error => {
                    console.error('Error al cargar los detalles del pedido:', error);

                    this.errorDetalles.set(
                        'No fue posible cargar los detalles de este pedido. Inténtalo nuevamente.'
                    );
                }
            });
    }

    reintentarDetalles(): void {
        const pedido = this.pedidoSeleccionado();

        if (!pedido) return;

        this.cargarDetallesPedido(pedido.idPedido);
    }

    cerrarModalDetalles(): void {
        if (this.cargandoDetalles()) return;

        this.mostrarModalDetalles.set(false);
        this.pedidoDetalle.set(null);
        this.pedidoSeleccionado.set(null);
        this.errorDetalles.set('');
    }

}
