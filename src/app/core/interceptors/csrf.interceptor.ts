
import {
    HttpBackend,
    HttpClient,
    HttpErrorResponse,
    HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

const API_URL = 'http://localhost:8080';
const CSRF_URL = `${API_URL}/api/auth/csrf`;
const REFRESH_URL = `${API_URL}/api/auth/refresh`;

interface CsrfTokenResponse {
    headerName: string;
    parameterName: string;
    token: string;
}

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
    const backendHttp = new HttpClient(inject(HttpBackend));

    // Solo interceptar peticiones dirigidas a nuestro backend.
    if (!request.url.startsWith(API_URL)) {
        return next(request);
    }

    const yaTieneCsrf = request.headers.keys().some((headerName) =>
        headerName.toLowerCase().includes('csrf')
    );
    if (request.url === REFRESH_URL && yaTieneCsrf) {
        return next(request.clone({ withCredentials: true }));
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
    return backendHttp.get<CsrfTokenResponse>(CSRF_URL, {
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

            return next(requestProtegida).pipe(
                catchError((error: { status?: number }) => {
                    if (error.status !== 401
                        || request.url === REFRESH_URL
                        || request.url === CSRF_URL
                        || request.url.startsWith(`${API_URL}/api/auth/`)) {
                        return throwError(() => error);
                    }

                    const refreshRequest = requestConCredenciales.clone({
                        url: REFRESH_URL,
                        method: 'POST',
                        body: {},
                        setHeaders: {
                            [respuesta.headerName]: respuesta.token
                        }
                    });

                    return backendHttp.request(refreshRequest).pipe(
                        switchMap(() => backendHttp.get<CsrfTokenResponse>(CSRF_URL, {
                            withCredentials: true
                        })),
                        switchMap(nuevoToken => {
                            if (!nuevoToken.token) {
                                return throwError(() => new Error(
                                    'El endpoint /api/auth/csrf no devolvió un token válido después de renovar la sesión.'
                                ));
                            }

                            const retryRequest = requestConCredenciales.clone({
                                setHeaders: {
                                    [nuevoToken.headerName]: nuevoToken.token
                                }
                            });
                            return backendHttp.request(retryRequest).pipe(
                                catchError((retryError: HttpErrorResponse) => {
                                    if (retryError.status !== 401) {
                                        return throwError(() => retryError);
                                    }

                                    return throwError(() => new HttpErrorResponse({
                                        error: {
                                            code: 'ENDPOINT_UNAUTHORIZED',
                                            message: 'La sesión se renovó, pero el endpoint rechazó la operación.',
                                            response: retryError.error
                                        },
                                        headers: retryError.headers,
                                        status: retryError.status,
                                        statusText: retryError.statusText,
                                        url: request.url
                                    }));
                                })
                            );
                        })
                    );
                })
            );
        })
    );
};