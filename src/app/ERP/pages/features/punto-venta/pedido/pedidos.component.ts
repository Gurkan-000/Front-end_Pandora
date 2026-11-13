
import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { PedidoERPService } from '../../../../services/pedido-erp.service';
import { ResponsePedidoERP } from '../../../../interfaces/reponse-pedido-erp.interface';

@Component({
    selector: 'app-pedidos-erp',
    standalone: true,
    imports: [
        CurrencyPipe,
        DatePipe
    ],
    templateUrl: './pedidos.component.html',
    styleUrl: './pedidos.component.css'
})
export class PedidosERPComponent implements OnInit {

    private readonly pedidoService = inject(PedidoERPService);

    readonly pedidos = signal<ResponsePedidoERP[]>([]);
    readonly cargando = signal(false);
    readonly error = signal('');

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
        // Conectaremos aquí la apertura del modal de detalles.
        console.log('Pedido seleccionado:', pedido.idPedido);
    }
}
