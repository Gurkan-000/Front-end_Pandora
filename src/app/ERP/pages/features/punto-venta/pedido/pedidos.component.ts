import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { PedidoERPService } from '../../../../services/pedido-erp.service';
import { ResponsePedidoERP } from '../../../../interfaces/reponse-pedido-erp.interface';
import { DetallesPedidoModalERPComponent } from './detalles-pedido-modal/detalles-pedido-modal.component';

@Component({
    selector: 'app-pedidos-erp',
    standalone: true,
    imports: [
        CurrencyPipe,
        DatePipe,
        DetallesPedidoModalERPComponent
    ],
    templateUrl: './pedidos.component.html',
    styleUrl: './pedidos.component.css'
})
export class PedidosERPComponent implements OnInit {

    private readonly pedidoService = inject(PedidoERPService);

    readonly pedidos = signal<ResponsePedidoERP[]>([]);
    readonly cargando = signal(false);
    readonly error = signal('');

    readonly pedidoSeleccionado = signal<ResponsePedidoERP | null>(null);

    ngOnInit(): void {
        this.cargarPedidos();
    }

    cargarPedidos(): void {
        this.cargando.set(true);
        this.error.set('');

        this.pedidoService.listarPedidos()
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: respuesta => {
                    this.pedidos.set(respuesta);
                },
                error: error => {
                    console.error('Error al cargar los pedidos:', error);
                    this.error.set(
                        'No fue posible cargar los pedidos. Inténtalo nuevamente.'
                    );
                }
            });
    }

    verDetalles(pedido: ResponsePedidoERP): void {
        this.pedidoSeleccionado.set(pedido);
    }

    cerrarDetalles(): void {
        this.pedidoSeleccionado.set(null);
    }

    actualizarEstadoPedido(nuevoEstado: string): void {
        const pedidoActual = this.pedidoSeleccionado();

        if (!pedidoActual) {
            return;
        }

        this.pedidos.update(pedidos =>
            pedidos.map(pedido =>
                pedido.idPedido === pedidoActual.idPedido
                    ? { ...pedido, estadoPedido: nuevoEstado }
                    : pedido
            )
        );

        this.pedidoSeleccionado.update(pedido =>
            pedido
                ? { ...pedido, estadoPedido: nuevoEstado }
                : null
        );
    }
}