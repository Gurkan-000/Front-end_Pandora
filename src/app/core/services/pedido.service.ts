import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CrearPedidoRequest } from '../interfaces/crear-pedido.interface';
import { ResponsePedidoCliente } from '../interfaces/response-pedido-cliente.interface';
import { ResponsePedidoDetalle } from '../interfaces/response-detalle-pedido.interface';

@Injectable({
    providedIn: 'root'
})
export class PedidoService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:8080/api/pedido';

    crearPedido(request: CrearPedidoRequest): Observable<void> {

        return this.http.post<void>(
            `${this.apiUrl}/crear`,
            request,
            {
                withCredentials: true
            }
        );
    }

    listarPedidosCliente(): Observable<ResponsePedidoCliente[]> {
        return this.http.get<ResponsePedidoCliente[]>(
            `${this.apiUrl}/listar/cliente`,
            {
                withCredentials: true
            }
        );
    }

    listarDetallesPedido(idPedido: string): Observable<ResponsePedidoDetalle> {
        return this.http.get<ResponsePedidoDetalle>(
            `${this.apiUrl}/listar/${idPedido}/detalles`,
            { withCredentials: true }
        );
    }

}