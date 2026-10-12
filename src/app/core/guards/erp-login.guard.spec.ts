import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { erpLoginGuard } from './erp-login.guard';
import { AuthService } from '../services/auth.service';

describe('erpLoginGuard', () => {
    let authService: {
        obtenerSesion: ReturnType<typeof vi.fn>;
        limpiarSesionLocal: ReturnType<typeof vi.fn>;
    };
    let dashboardUrl: UrlTree;
    let router: Pick<Router, 'createUrlTree'>;

    beforeEach(() => {
        dashboardUrl = {} as UrlTree;
        router = { createUrlTree: vi.fn(() => dashboardUrl) };
        authService = {
            obtenerSesion: vi.fn(),
            limpiarSesionLocal: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: router }
            ]
        });
    });

    it('redirige al dashboard si /me confirma un ADMIN', async () => {
        authService.obtenerSesion.mockReturnValue(of({ rol: 'ADMIN' }));

        const result = await firstValueFrom(TestBed.runInInjectionContext(() => erpLoginGuard(
            {} as ActivatedRouteSnapshot,
            {} as RouterStateSnapshot
        )) as ReturnType<typeof of>);

        expect(result).toBe(dashboardUrl);
        expect(authService.obtenerSesion).toHaveBeenCalledOnce();
        expect(router.createUrlTree).toHaveBeenCalledWith(['/erp/dashboard']);
    });

    it('permite ver el login si no hay sesión activa', async () => {
        authService.obtenerSesion.mockReturnValue(throwError(() => ({ status: 401 })));

        const result = await firstValueFrom(TestBed.runInInjectionContext(() => erpLoginGuard(
            {} as ActivatedRouteSnapshot,
            {} as RouterStateSnapshot
        )) as ReturnType<typeof of>);

        expect(result).toBe(true);
        expect(authService.limpiarSesionLocal).toHaveBeenCalledOnce();
    });

    it('no redirige cuentas que no tienen rol administrador', async () => {
        authService.obtenerSesion.mockReturnValue(of({ rol: 'CLIENTE' }));

        const result = await firstValueFrom(TestBed.runInInjectionContext(() => erpLoginGuard(
            {} as ActivatedRouteSnapshot,
            {} as RouterStateSnapshot
        )) as ReturnType<typeof of>);

        expect(result).toBe(true);
        expect(router.createUrlTree).not.toHaveBeenCalled();
    });
});