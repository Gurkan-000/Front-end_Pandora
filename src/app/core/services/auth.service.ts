import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';

import { LoginRequest } from '../interfaces/login-request.interface';
import { RegisterRequest } from '../interfaces/register-request.interface';
import { ResponseAuth } from '../interfaces/response-auth.interface';

export interface ConfirmarContrasenaRequest {
    token: string;
    contrasenaNueva: string;
    contrasenaConfirmada: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:8080/api/auth';

    // Usuario autenticado actual (se llena con obtenerSesion()).
    private readonly usuarioActualSignal = signal<ResponseAuth | null>(null);

    readonly usuarioActual = this.usuarioActualSignal.asReadonly();


    obtenerUsuarioActual(): Observable<ResponseAuth> {

        return this.http.get<ResponseAuth>(
            `${this.apiUrl}/me`,
            {
                withCredentials: true
            }
        ).pipe(
            tap(usuario => this.usuarioActualSignal.set(usuario))
        );
    }


    refrescarSesion(): Observable<void> {

        return this.http.post<void>(
            `${this.apiUrl}/refresh`,
            {},
            {
                withCredentials: true
            }
        );
    }


    // Consulta /me; si el access token expiró (401) intenta renovarlo
    // con el refresh token y vuelve a consultar una sola vez.
    obtenerSesion(): Observable<ResponseAuth> {

        return this.obtenerUsuarioActual().pipe(
            catchError((error: HttpErrorResponse) => {

                if (error.status !== 401) {
                    return throwError(() => error);
                }

                return this.refrescarSesion().pipe(
                    switchMap(() => this.obtenerUsuarioActual())
                );
            })
        );
    }


    limpiarSesionLocal(): void {
        this.usuarioActualSignal.set(null);
    }



    iniciarSesion(
        request: LoginRequest
    ): Observable<ResponseAuth> {

        return this.http.post<ResponseAuth>(
            `${this.apiUrl}/iniciarSesion`,
            request,
            {
                withCredentials: true
            }
        );
    }


    registrar(
        request: RegisterRequest
    ): Observable<void> {

        return this.http.post<void>(
            `${this.apiUrl}/registrar`,
            request,
            {
                withCredentials: true
            }
        );
    }


    cerrarSesion(): Observable<string> {

        return this.http.post(
            `${this.apiUrl}/cerrarSesion`,
            {},
            {
                withCredentials: true,
                responseType: 'text'
            }
        );
    }


    recuperarContrasena(
        correo: string
    ): Observable<string> {

        const params = new HttpParams()
            .set('correo', correo);

        return this.http.post(
            `${this.apiUrl}/recuperar-contrasena`,
            null,
            {
                params,
                responseType: 'text'
            }
        );
    }


    confirmarContrasena(
        request: ConfirmarContrasenaRequest
    ): Observable<string> {

        return this.http.put(
            `${this.apiUrl}/confirmar-contrasena`,
            request,
            {
                responseType: 'text'
            }
        );
    }

}