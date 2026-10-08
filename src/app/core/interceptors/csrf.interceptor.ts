
import {
    HttpClient,
    HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { switchMap } from 'rxjs';

const API_URL = 'http://localhost:8080';
const CSRF_URL = `${API_URL}/api/auth/csrf`;

interface CsrfTokenResponse {
    headerName: string;
    parameterName: string;
    token: string;
}

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
    const http = inject(HttpClient);

    // Solo interceptar peticiones dirigidas a nuestro backend.
    if (!request.url.startsWith(API_URL)) {
        return next(request);
    }

    const requestConCredenciales = request.clone({
        withCredentials: true
    });

    const metodo = request.method.toUpperCase();

    // Las peticiones de lectura no necesitan enviar el encabezado CSRF.
    if (['GET', 'HEAD', 'OPTIONS'].includes(metodo)) {
        return next(requestConCredenciales);
    }

    // Obtener el token directamente de la respuesta JSON del backend.
    return http.get<CsrfTokenResponse>(CSRF_URL, {
        withCredentials: true
    }).pipe(
        switchMap(respuesta => {
            if (!respuesta.token) {
                throw new Error(
                    'El endpoint /api/auth/csrf no devolvió un token válido.'
                );
            }

            // Usar el nombre de encabezado que devuelve Spring Security.
            const requestProtegida = requestConCredenciales.clone({
                setHeaders: {
                    [respuesta.headerName]: respuesta.token
                }
            });

            return next(requestProtegida);
        })
    );
};