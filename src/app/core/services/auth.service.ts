import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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