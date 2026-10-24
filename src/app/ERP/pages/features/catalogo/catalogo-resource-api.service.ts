
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type CatalogResource =
    | 'categoria'
    | 'subcategoria'
    | 'marca'
    | 'atributo'
    | 'valorAtributo';

export type CatalogRecord = Record<string, string>;

@Injectable({
    providedIn: 'root'
})
export class CatalogoResourceApiService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api';

    listar(resource: CatalogResource): Observable<CatalogRecord[]> {
        return this.http.get<CatalogRecord[]>(
            `${this.urlRecurso(resource)}/listar`
        );
    }

    listarSubcategoriasPorCategoria(idCategoria: string): Observable<CatalogRecord[]> {
        return this.http.get<CatalogRecord[]>(
            `${this.apiUrl}/subcategoria/listar/categoria/${encodeURIComponent(idCategoria)}`
        );
    }

    listarValoresPorAtributo(idAtributo: string): Observable<CatalogRecord[]> {
        return this.http.get<CatalogRecord[]>(
            `${this.apiUrl}/valor-atributo/listar/atributo/${encodeURIComponent(idAtributo)}`
        );
    }

    obtener(
        resource: CatalogResource,
        id: string
    ): Observable<CatalogRecord> {
        return this.http.get<CatalogRecord>(
            `${this.urlRecurso(resource)}/${encodeURIComponent(id)}`
        );
    }

    crear(
        resource: CatalogResource,
        payload: CatalogRecord,
        parentId?: string
    ): Observable<CatalogRecord> {
        const parentPath = parentId
            ? `/${encodeURIComponent(parentId)}`
            : '';

        return this.http.post<CatalogRecord>(
            `${this.urlRecurso(resource)}/crear${parentPath}`,
            payload
        );
    }


    actualizar(
        resource: CatalogResource,
        id: string,
        payload: CatalogRecord,
        parentId?: string
    ): Observable<string> {
        const idEncoded = encodeURIComponent(id);
        let url = `${this.urlRecurso(resource)}/actualizar/${idEncoded}`;

        if (resource === 'subcategoria') {
            if (!parentId) {
                throw new Error('El ID de la categoría es obligatorio para actualizar una subcategoría.');
            }

            url += `/categoria/${encodeURIComponent(parentId)}`;
        } else if (resource === 'valorAtributo') {
            if (!parentId) {
                throw new Error('El ID del atributo es obligatorio para actualizar un valor de atributo.');
            }

            url += `/atributo/${encodeURIComponent(parentId)}`;
        }

        return this.http.put(url, payload, { responseType: 'text' });
    }


    eliminar(
        resource: CatalogResource,
        id: string
    ): Observable<string> {
        return this.http.delete(
            `${this.urlRecurso(resource)}/eliminar/${encodeURIComponent(id)}`,
            { responseType: 'text' }
        );
    }

    private urlRecurso(resource: CatalogResource): string {
        const resourcePath = resource === 'valorAtributo'
            ? 'valor-atributo'
            : resource;

        return `${this.apiUrl}/${resourcePath}`;
    }
}
