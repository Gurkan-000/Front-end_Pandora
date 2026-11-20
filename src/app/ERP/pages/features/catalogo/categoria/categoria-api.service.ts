import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Categoria, CategoriaRequest } from './categoria.interface';
import { API_URL } from '../../../../../core/config/api.config';

@Injectable({
    providedIn: 'root'
})
export class CategoriaApiService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${API_URL}/categoria`;

    listar(): Observable<Categoria[]> {
        return this.http.get<Categoria[]>(`${this.apiUrl}/listar`);
    }

    obtener(id: string): Observable<Categoria> {
        return this.http.get<Categoria>(`${this.apiUrl}/${encodeURIComponent(id)}`);
    }

    crear(request: CategoriaRequest): Observable<Categoria> {
        return this.http.post<Categoria>(`${this.apiUrl}/crear`, request);
    }


    actualizar(id: string, request: CategoriaRequest): Observable<string> {
        return this.http.put(
            `${this.apiUrl}/actualizar/${encodeURIComponent(id)}`,
            request,
            { responseType: 'text' }
        );
    }


    eliminar(id: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/eliminar/${encodeURIComponent(id)}`, {
            responseType: 'text'
        });
    }
}