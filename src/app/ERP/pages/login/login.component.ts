import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-erp-login',
    standalone: true,
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginERPComponent {

    private readonly formBuilder = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
        private readonly changeDetectorRef = inject(ChangeDetectorRef);

    mensaje = '';
    error = '';

    cargando = false;

    loginForm = this.formBuilder.nonNullable.group({
        correo: [
            '',
            [
                Validators.required,
                Validators.email
            ]
        ],
        contrasena: [
            '',
            [
                Validators.required
            ]
        ]
    });

    iniciarSesion(): void {

        this.mensaje = '';
        this.error = '';

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.cargando = true;

        this.authService.iniciarSesion(
            this.loginForm.getRawValue()
        ).subscribe({

            next: (response) => {
                this.cargando = false;

                // Solo el administrador puede entrar al ERP.
                if (response.rol !== 'ADMIN') {
                    this.authService.cerrarSesion().subscribe();

                    this.error = 'Esta cuenta no tiene acceso al ERP.';
                    this.changeDetectorRef.detectChanges();
                    return;
                }

                this.router.navigate(['/erp/dashboard']);
            },

            error: (error) => {
                this.cargando = false;

                console.error('Error al iniciar sesión en ERP:', error);

                this.error = 'Correo o contraseña incorrectos.';
                this.changeDetectorRef.detectChanges();
            }

        });
    }
}