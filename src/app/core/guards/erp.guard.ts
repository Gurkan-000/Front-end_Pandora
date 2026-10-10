import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

// Protege todo el módulo ERP: solo entra un usuario autenticado con rol ADMIN.
export const erpGuard: CanActivateFn = () => {

    const authService = inject(AuthService);
    const router = inject(Router);

    const loginErp = router.createUrlTree(['/erp/login']);

    return authService.obtenerSesion().pipe(
        map(usuario => usuario.rol === 'ADMIN' ? true : loginErp),
        catchError(() => of(loginErp))
    );
};
