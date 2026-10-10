import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CatalogoResourceApiService, CatalogResource } from './catalogo-resource-api.service';

describe('CatalogoResourceApiService', () => {
    let service: CatalogoResourceApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(CatalogoResourceApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTestingController.verify());

    const resources: CatalogResource[] = ['subcategoria', 'marca', 'atributo', 'valorAtributo'];

    for (const resource of resources) {
        it(`lista ${resource} desde su endpoint`, () => {
            service.listar(resource).subscribe();
            const endpoint = resource === 'valorAtributo' ? 'valor-atributo' : resource;
            const request = httpTestingController.expectOne(`http://localhost:8080/api/${endpoint}/listar`);
            expect(request.request.method).toBe('GET');
            request.flush([]);
        });
    }

    it('crea una subcategoría con el id de categoría asociado', () => {
        const payload = { nombreSubCategoria: 'Pantalones' };
        service.crear('subcategoria', payload, 'cat-1').subscribe();

        const request = httpTestingController.expectOne('http://localhost:8080/api/subcategoria/crear/cat-1');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(payload);
        request.flush({ idSubcategoria: 'sub-1', idCategoria: 'cat-1', ...payload });
    });

    it('crea un valor de atributo con el id de atributo asociado', () => {
        const payload = { valor: 'Verde' };
        service.crear('valorAtributo', payload, 'attr-1').subscribe();

        const request = httpTestingController.expectOne('http://localhost:8080/api/valor-atributo/crear/attr-1');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(payload);
        request.flush({ idValorAtributo: 'val-1', idAtributo: 'attr-1', ...payload });
    });

    it('obtiene, actualiza y elimina por id en la ruta', () => {
        service.obtener('marca', 'brand-1').subscribe();
        const getRequest = httpTestingController.expectOne('http://localhost:8080/api/marca/brand-1');
        expect(getRequest.request.method).toBe('GET');
        getRequest.flush({ idMarca: 'brand-1', nombreMarca: 'Rumbo' });

        service.actualizar('atributo', 'attr-1', { nombreAtributo: 'Color' }).subscribe();
        const putRequest = httpTestingController.expectOne('http://localhost:8080/api/atributo/actualizar/attr-1');
        expect(putRequest.request.method).toBe('PUT');
        expect(putRequest.request.body).toEqual({ nombreAtributo: 'Color' });
        putRequest.flush({ idAtributo: 'attr-1', nombreAtributo: 'Color' });

        service.eliminar('valorAtributo', 'value-1').subscribe();
        const deleteRequest = httpTestingController.expectOne('http://localhost:8080/api/valor-atributo/eliminar/value-1');
        expect(deleteRequest.request.method).toBe('DELETE');
        deleteRequest.flush('Eliminado');
    });
});