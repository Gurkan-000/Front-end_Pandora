import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type CatalogResource = 'categoria' | 'subcategoria' | 'marca' | 'atributo' | 'valorAtributo';
export type CatalogRecord = Record<string, string>;

@Injectable({
    providedIn: 'root'
})
export class CatalogoResourceApiService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api';

    listar(resource: CatalogResource): Observable<CatalogRecord[]> {
        return this.http.get<CatalogRecord[]>(`${this.urlRecurso(resource)}/listar`);
    }

    obtener(resource: CatalogResource, id: string): Observable<CatalogRecord> {
        return this.http.get<CatalogRecord>(`${this.urlRecurso(resource)}/${encodeURIComponent(id)}`);
    }

    crear(resource: CatalogResource, payload: CatalogRecord, parentId?: string): Observable<CatalogRecord> {
        const parentPath = parentId ? `/${encodeURIComponent(parentId)}` : '';
        return this.http.post<CatalogRecord>(`${this.urlRecurso(resource)}/crear${parentPath}`, payload);
    }

    actualizar(resource: CatalogResource, id: string, payload: CatalogRecord): Observable<CatalogRecord> {
        return this.http.put<CatalogRecord>(
            `${this.urlRecurso(resource)}/actualizar/${encodeURIComponent(id)}`,
            payload
        );
    }

    eliminar(resource: CatalogResource, id: string): Observable<string> {
        return this.http.delete(`${this.urlRecurso(resource)}/eliminar/${encodeURIComponent(id)}`, {
            responseType: 'text'
        });
    }

    private urlRecurso(resource: CatalogResource): string {
        const resourcePath = resource === 'valorAtributo' ? 'valor-atributo' : resource;
        return `${this.apiUrl}/${resourcePath}`;
    }
}