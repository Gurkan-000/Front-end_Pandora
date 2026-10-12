import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const erpLoginGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.obtenerSesion().pipe(
        map((usuario) => usuario.rol === 'ADMIN'
            ? router.createUrlTree(['/erp/dashboard'])
            : true
        ),
        catchError(() => {
            authService.limpiarSesionLocal();
            return of(true);
        })
    );
};