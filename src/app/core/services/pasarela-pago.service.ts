
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';

import { CrearPedidoRequest } from '../interfaces/crear-pedido.interface';

import {
    RequestCapturaPago,
    ResponseInicioPago,
    ResponsePagoConfirmado
} from '../interfaces/pago.interface';

@Injectable({
    providedIn: 'root'
})
export class PasarelaPagoService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${API_URL}/pasarela-pago`;

    crearOrden(
        request: CrearPedidoRequest
    ): Observable<ResponseInicioPago> {

        return this.http.post<ResponseInicioPago>(
            `${this.apiUrl}/paypal/crear`,
            request,
            {
                withCredentials: true
            }
        );
    }

    capturarPago(
        request: RequestCapturaPago
    ): Observable<ResponsePagoConfirmado> {

        return this.http.post<ResponsePagoConfirmado>(
            `${this.apiUrl}/paypal/capturar`,
            request,
            {
                withCredentials: true
            }
        );
    }

}
