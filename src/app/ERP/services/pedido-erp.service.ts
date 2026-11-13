
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResponsePedidoERP } from '../interfaces/reponse-pedido-erp.interface';

@Injectable({
    providedIn: 'root'
})
export class PedidoERPService {

    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/pedido';

    listarPedidos(): Observable<ResponsePedidoERP[]> {
        return this.http.get<ResponsePedidoERP[]>(`${this.apiUrl}/listar`);
    }
}
