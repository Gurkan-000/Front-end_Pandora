import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResponsePedidoERP } from '../interfaces/reponse-pedido-erp.interface';
import { ResponsePedidoDetalleERP } from '../interfaces/response-detalle-pedido-erp.interface';

import { API_URL } from '../../core/config/api.config';

@Injectable({
    providedIn: 'root'
})
export class PedidoERPService {

    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${API_URL}/pedido`;

    listarPedidos(): Observable<ResponsePedidoERP[]> {
        return this.http.get<ResponsePedidoERP[]>(
            `${this.apiUrl}/listar`
        );
    }

    listarDetallesPedido(
        idPedido: string
    ): Observable<ResponsePedidoDetalleERP> {
        return this.http.get<ResponsePedidoDetalleERP>(
            `${this.apiUrl}/listar/${encodeURIComponent(idPedido)}/detalles`
        );
    }

    enviarPedido(idPedido: string): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/enviar/${encodeURIComponent(idPedido)}`,
            null
        );
    }

    entregarPedido(idPedido: string): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/entregar/${encodeURIComponent(idPedido)}`,
            null
        );
    }
}