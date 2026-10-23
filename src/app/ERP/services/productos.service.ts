
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ResponseProducto } from '../interfaces/response-producto.interface';
import {
    CrearProductoRequest,
    ResponseAtributo,
    ResponseMarca,
    ResponseSubcategoria,
    ResponseImagen
} from '../interfaces/crear-producto.interface';

@Injectable({
    providedIn: 'root'
})
export class ProductosService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:8080/api';

    listarProductos(): Observable<ResponseProducto[]> {
        return this.http.get<ResponseProducto[]>(
            `${this.apiUrl}/producto/listar`
        );
    }

    listarMarcas(): Observable<ResponseMarca[]> {
        return this.http.get<ResponseMarca[]>(
            `${this.apiUrl}/marca/listar`
        );
    }

    listarSubcategorias(): Observable<ResponseSubcategoria[]> {
        return this.http.get<ResponseSubcategoria[]>(
            `${this.apiUrl}/subcategoria/listar`
        );
    }

    listarAtributos(): Observable<ResponseAtributo[]> {
        return this.http.get<ResponseAtributo[]>(
            `${this.apiUrl}/atributo/listar`
        );
    }

    listarAtributosProducto(idProducto: string): Observable<ResponseAtributo[]> {
        return this.http.get<ResponseAtributo[]>(
            `${this.apiUrl}/producto/listar/${idProducto}/atributos`
        );
    }

    actualizarProducto(
        idProducto: string,
        idMarca: string,
        idSubCategoria: string,
        request: CrearProductoRequest
    ): Observable<string> {
        return this.http.put(
            `${this.apiUrl}/producto/actualizar/${idProducto}/marca/${idMarca}/subcategoria/${idSubCategoria}`,
            request,
            { responseType: 'text' }
        );
    }

    crearProducto(
        idMarca: string,
        idSubCategoria: string,
        request: CrearProductoRequest
    ): Observable<unknown> {
        const url =
            `${this.apiUrl}/producto/crear/marca/${idMarca}` +
            `/subcategoria/${idSubCategoria}`;

        return this.http.post<unknown>(url, request);
    }

    eliminarProducto(idProducto: string): Observable<string> {
        return this.http.delete(
            `${this.apiUrl}/producto/eliminar/${idProducto}`,
            { responseType: 'text' }
        );
    }

    subirImagen(imagen: File): Observable<ResponseImagen> {
        const formData = new FormData();
        formData.append('imagen', imagen);

        return this.http.post<ResponseImagen>(
            `${this.apiUrl}/imagen`,
            formData
        );
    }

    eliminarImagen(urlImagen: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}${urlImagen}`
        );
    }

}