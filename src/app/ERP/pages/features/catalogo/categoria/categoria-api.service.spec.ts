import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoriaApiService } from './categoria-api.service';

describe('CategoriaApiService', () => {
    let service: CategoriaApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(CategoriaApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTestingController.verify());

    it('lista categorías con GET /api/categoria/listar', () => {
        service.listar().subscribe((categorias) => {
            expect(categorias).toEqual([{ idCategoria: 'cat-1', nombreCategoria: 'Vestimentas' }]);
        });

        const request = httpTestingController.expectOne('http://localhost:8080/api/categoria/listar');
        expect(request.request.method).toBe('GET');
        request.flush([{ idCategoria: 'cat-1', nombreCategoria: 'Vestimentas' }]);
    });

    it('obtiene una categoría por id', () => {
        service.obtener('cat-1').subscribe((categoria) => {
            expect(categoria.nombreCategoria).toBe('Vestimentas');
        });

        const request = httpTestingController.expectOne('http://localhost:8080/api/categoria/cat-1');
        expect(request.request.method).toBe('GET');
        request.flush({ idCategoria: 'cat-1', nombreCategoria: 'Vestimentas' });
    });

    it('crea una categoría con el body esperado', () => {
        service.crear({ nombreCategoria: 'Vestimentas' }).subscribe();

        const request = httpTestingController.expectOne('http://localhost:8080/api/categoria/crear');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ nombreCategoria: 'Vestimentas' });
        request.flush({ idCategoria: 'cat-1', nombreCategoria: 'Vestimentas' });
    });

    it('actualiza una categoría usando el id en la ruta', () => {
        service.actualizar('cat-1', { nombreCategoria: 'Vestimenta' }).subscribe();

        const request = httpTestingController.expectOne('http://localhost:8080/api/categoria/actualizar/cat-1');
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({ nombreCategoria: 'Vestimenta' });
        request.flush({ idCategoria: 'cat-1', nombreCategoria: 'Vestimenta' });
    });

    it('elimina una categoría usando el id en la ruta', () => {
        service.eliminar('cat-1').subscribe();

        const request = httpTestingController.expectOne('http://localhost:8080/api/categoria/eliminar/cat-1');
        expect(request.request.method).toBe('DELETE');
        request.flush('Categoría eliminada');
    });
});