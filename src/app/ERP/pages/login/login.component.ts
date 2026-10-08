import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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

                console.log('Login ERP correcto');
                console.log('Rol:', response.rol);

                this.mensaje = 'Inicio de sesión correcto.';
                this.changeDetectorRef.detectChanges();
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