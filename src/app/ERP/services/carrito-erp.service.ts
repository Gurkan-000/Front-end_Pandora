import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResponseCarritoERP } from '../interfaces/response-carrito-erp.interface';
import { ResponseDetalleCarritoERP } from '../interfaces/response-detalle-carrito-erp.interface';

import { API_URL } from '../../core/config/api.config';

@Injectable({
    providedIn: 'root'
})
export class CarritoERPService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${API_URL}/carrito`;

    listarCarritos(): Observable<ResponseCarritoERP[]> {
        return this.http.get<ResponseCarritoERP[]>(
            `${this.apiUrl}/listar`
        );
    }
    
    listarDetallesCarrito(idCarrito: string): Observable<ResponseDetalleCarritoERP[]> {
        return this.http.get<ResponseDetalleCarritoERP[]>(
            `${this.apiUrl}/${idCarrito}/detalles`
        );
    }

    vaciarCarrito(idCarrito: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/vaciar/${idCarrito}`
        );
    }

}