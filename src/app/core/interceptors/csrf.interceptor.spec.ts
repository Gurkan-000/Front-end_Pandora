import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';

import { csrfInterceptor } from './csrf.interceptor';

describe('csrfInterceptor', () => {
    let http: HttpClient;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([csrfInterceptor])),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpClient);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTestingController.verify());

    it('renueva la sesión y reintenta una escritura una sola vez tras un 401', () => {
        let respuesta: unknown;
        let errorRecibido: unknown;
        http.post('http://localhost:8080/api/valor-atributo/crear/attr-1', { valor: 'Verde' })
            .subscribe({ next: (value) => respuesta = value, error: (error) => errorRecibido = error });

        httpTestingController.expectOne('http://localhost:8080/api/auth/csrf').flush({
            headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'csrf-before'
        });

        const originalRequest = httpTestingController.expectOne('http://localhost:8080/api/valor-atributo/crear/attr-1');
        expect(originalRequest.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-before');
        originalRequest.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        const refreshRequest = httpTestingController.expectOne('http://localhost:8080/api/auth/refresh');
        expect(refreshRequest.request.method).toBe('POST');
        expect(refreshRequest.request.withCredentials).toBe(true);
        expect(refreshRequest.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-before');
        refreshRequest.flush(null);

        const csrfRefreshRequests = httpTestingController.match('http://localhost:8080/api/auth/csrf');
        const activeCsrfRefreshRequests = csrfRefreshRequests.filter((request) => !request.cancelled);
        expect(activeCsrfRefreshRequests).toHaveLength(1);
        activeCsrfRefreshRequests.forEach((request) => request.flush({
            headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'csrf-after'
        }));

        const retryRequests = httpTestingController.match('http://localhost:8080/api/valor-atributo/crear/attr-1');
        expect(retryRequests).toHaveLength(1);
        const retryRequest = retryRequests[0];
        expect(retryRequest.request.method).toBe('POST');
        expect(retryRequest.request.body).toEqual({ valor: 'Verde' });
        expect(retryRequest.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-after');
        retryRequest.flush({ idValorAtributo: 'value-1', valor: 'Verde' });

        expect(respuesta).toEqual({ idValorAtributo: 'value-1', valor: 'Verde' });
        expect(errorRecibido).toBeUndefined();
    });

    it('no reintenta si la renovación de sesión falla', () => {
        let errorRecibido: unknown;
        http.post('http://localhost:8080/api/categoria/crear', { nombreCategoria: 'Ropa' })
            .subscribe({ error: (error) => errorRecibido = error });

        httpTestingController.expectOne('http://localhost:8080/api/auth/csrf').flush({
            headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'csrf-before'
        });
        httpTestingController.expectOne('http://localhost:8080/api/categoria/crear')
            .flush({}, { status: 401, statusText: 'Unauthorized' });
        httpTestingController.expectOne('http://localhost:8080/api/auth/refresh')
            .flush({}, { status: 401, statusText: 'Unauthorized' });
        const pendingCsrf = httpTestingController.match('http://localhost:8080/api/auth/csrf');
        pendingCsrf.filter((request) => !request.cancelled).forEach((request) => request.flush({
            headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'unused'
        }));

        expect(errorRecibido).toBeInstanceOf(HttpErrorResponse);
        expect(httpTestingController.match('http://localhost:8080/api/categoria/crear')).toHaveLength(0);
    });

    it('identifica un 401 persistente del endpoint cuando el refresh sí tuvo éxito', () => {
        let errorRecibido: HttpErrorResponse | undefined;
        const endpoint = 'http://localhost:8080/api/valor-atributo/crear/attr-1';
        http.post(endpoint, { valor: 'Verde' }).subscribe({
            error: (error: HttpErrorResponse) => errorRecibido = error
        });

        httpTestingController.expectOne('http://localhost:8080/api/auth/csrf').flush({
            headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'csrf-before'
        });
        httpTestingController.expectOne(endpoint).flush({}, { status: 401, statusText: 'Unauthorized' });
        httpTestingController.expectOne('http://localhost:8080/api/auth/refresh').flush(null);

        const csrfRequests = httpTestingController.match('http://localhost:8080/api/auth/csrf');
        csrfRequests.filter((request) => !request.cancelled).forEach((request) => request.flush({
            headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'csrf-after'
        }));
        httpTestingController.expectOne(endpoint).flush(
            { message: 'Access denied for this route' },
            { status: 401, statusText: 'Unauthorized' }
        );

        expect(errorRecibido?.url).toBe(endpoint);
        expect(errorRecibido?.error.code).toBe('ENDPOINT_UNAUTHORIZED');
        expect(errorRecibido?.error.response).toEqual({ message: 'Access denied for this route' });
    });
});