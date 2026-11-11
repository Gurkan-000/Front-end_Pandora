
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

    obtenerCarrito(correo: string): Observable<ResponseCarrito> {

        return this.http.get<ResponseCarrito>(
            `${this.apiUrl}/${encodeURIComponent(correo)}`,
            {
                withCredentials: true
            }
        );
    }

    agregarProducto(
        correo: string,
        idVarianteProducto: string,
        cantidad: number
    ): Observable<void> {
        return this.http.post<void>(
            `${this.apiUrl}/${encodeURIComponent(correo)}/agregar-detalle/${encodeURIComponent(idVarianteProducto)}`,
            {
                cantidad: cantidad
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
}
