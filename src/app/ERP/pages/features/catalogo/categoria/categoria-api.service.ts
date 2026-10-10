import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Categoria, CategoriaRequest } from './categoria.interface';

@Injectable({
    providedIn: 'root'
})
export class CategoriaApiService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/categoria';

    listar(): Observable<Categoria[]> {
        return this.http.get<Categoria[]>(`${this.apiUrl}/listar`);
    }

    obtener(id: string): Observable<Categoria> {
        return this.http.get<Categoria>(`${this.apiUrl}/${encodeURIComponent(id)}`);
    }

    crear(request: CategoriaRequest): Observable<Categoria> {
        return this.http.post<Categoria>(`${this.apiUrl}/crear`, request);
    }

    actualizar(id: string, request: CategoriaRequest): Observable<Categoria> {
        return this.http.put<Categoria>(
            `${this.apiUrl}/actualizar/${encodeURIComponent(id)}`,
            request
        );
    }

    eliminar(id: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/eliminar/${encodeURIComponent(id)}`, {
            responseType: 'text'
        });
    }
}