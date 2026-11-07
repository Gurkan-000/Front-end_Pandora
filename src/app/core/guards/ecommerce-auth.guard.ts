import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const ecommerceAuthGuard: CanActivateFn = () => {

    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.validarSesion().pipe(
        map(autenticado =>
            autenticado
                ? true
                : router.createUrlTree(['/login'])
        )
    );
};