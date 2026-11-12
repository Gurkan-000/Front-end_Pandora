
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ResponseCarrito } from '../interfaces/carrito.interface';

@Injectable({
    providedIn: 'root'
})
export class CarritoService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:8080/api/carrito';

    obtenerCarrito(): Observable<ResponseCarrito> {

        return this.http.get<ResponseCarrito>(
            `${this.apiUrl}/mi-carrito`,
            {
                withCredentials: true
            }
        );
    }

    agregarProducto(
        idVarianteProducto: string,
        cantidad: number
    ): Observable<void> {

        return this.http.post<void>(
            `${this.apiUrl}/agregar-detalle/${encodeURIComponent(idVarianteProducto)}`,
            {
                cantidad
            },
            {
                withCredentials: true
            }
        );
    }

    quitarDetalle(idDetalleCarrito: string): Observable<void> {

        return this.http.delete<void>(
            `${this.apiUrl}/quitar-detalle/${encodeURIComponent(idDetalleCarrito)}`,
            {
                withCredentials: true
            }
        );
    }

    vaciarCarrito(idCarrito: string): Observable<void> {

        return this.http.delete<void>(
            `${this.apiUrl}/vaciar/${encodeURIComponent(idCarrito)}`,
            {
                withCredentials: true
            }
        );
    }
}
