import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService session validation', () => {
    let service: AuthService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(AuthService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTestingController.verify());

    it('consults /me, refreshes on 401 and consults /me again', () => {
        let user: { rol: string; nombre?: string } | undefined;
        service.obtenerSesion().subscribe((response) => user = response);

        httpTestingController.expectOne('http://localhost:8080/api/auth/me')
            .flush({}, { status: 401, statusText: 'Unauthorized' });
        const refreshRequest = httpTestingController.expectOne('http://localhost:8080/api/auth/refresh');
        expect(refreshRequest.request.method).toBe('POST');
        expect(refreshRequest.request.withCredentials).toBe(true);
        refreshRequest.flush(null);

        httpTestingController.expectOne('http://localhost:8080/api/auth/me').flush({
            rol: 'ADMIN', nombre: 'Felipe', apellido: 'Perez', correo: 'pepito@gmail.com'
        });

        expect(user).toEqual({ rol: 'ADMIN', nombre: 'Felipe', apellido: 'Perez', correo: 'pepito@gmail.com' });
        expect(service.usuarioActual()?.rol).toBe('ADMIN');
    });

    it('limpia la sesión local si el refresh también devuelve 401', () => {
        service.obtenerUsuarioActual().subscribe();
        httpTestingController.expectOne('http://localhost:8080/api/auth/me').flush({
            rol: 'ADMIN', nombre: 'Felipe', apellido: 'Perez', correo: 'pepito@gmail.com'
        });
        expect(service.usuarioActual()?.rol).toBe('ADMIN');

        let status: number | undefined;
        service.obtenerSesion().subscribe({ error: (error: { status: number }) => status = error.status });
        httpTestingController.expectOne('http://localhost:8080/api/auth/me')
            .flush({}, { status: 401, statusText: 'Unauthorized' });
        httpTestingController.expectOne('http://localhost:8080/api/auth/refresh')
            .flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(status).toBe(401);
        expect(service.usuarioActual()).toBeNull();
    });
});