import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginCommerceComponent {

    private readonly formBuilder = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    modoRegistro = false;

    modoRecuperacion = false;

    mensaje = '';
    error = '';

    mensajeRecuperacion = '';
    errorRecuperacion = '';

    cargando = false;
    cargandoRecuperacion = false;

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

    registerForm = this.formBuilder.nonNullable.group({
        nombre: [
            '',
            [
                Validators.required
            ]
        ],
        apellido: [
            '',
            [
                Validators.required
            ]
        ],
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

    recuperacionForm = this.formBuilder.nonNullable.group({
        correo: [
            '',
            [
                Validators.required,
                Validators.email
            ]
        ]
    });


    cambiarModo(): void {
        this.modoRegistro = !this.modoRegistro;

        this.mensaje = '';
        this.error = '';

        this.mensajeRecuperacion = '';
        this.errorRecuperacion = '';
    }


    abrirRecuperacion(): void {
        this.modoRecuperacion = true;

        this.mensajeRecuperacion = '';
        this.errorRecuperacion = '';

        this.recuperacionForm.reset();
    }


    cerrarRecuperacion(): void {
        this.modoRecuperacion = false;

        this.mensajeRecuperacion = '';
        this.errorRecuperacion = '';

        this.recuperacionForm.reset();
    }


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

                console.log('Login correcto');
                console.log('Rol:', response.rol);
                
                this.changeDetectorRef.detectChanges();
            },

            error: (error) => {

                this.cargando = false;

                console.error('Error al iniciar sesión:', error);

                this.error = 'Correo o contraseña incorrectos.';

                this.changeDetectorRef.detectChanges();
            }

        });
    }


    registrar(): void {

        this.mensaje = '';
        this.error = '';

        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.cargando = true;

        this.authService.registrar(
            this.registerForm.getRawValue()
        ).subscribe({

            next: () => {

                this.cargando = false;

                this.mensaje =
                    'Se ha enviado un correo de verificación. Revisa tu bandeja de entrada.';

                this.registerForm.reset();

            },

            error: (error) => {

                this.cargando = false;

                console.error('Error al registrar:', error);

                this.error =
                    'No fue posible crear la cuenta. Verifica los datos ingresados.';

                this.changeDetectorRef.detectChanges();
            }

        });
    }


    recuperarContrasena(): void {

        this.mensajeRecuperacion = '';
        this.errorRecuperacion = '';

        if (this.recuperacionForm.invalid) {
            this.recuperacionForm.markAllAsTouched();
            return;
        }

        this.cargandoRecuperacion = true;

        const correo = this.recuperacionForm.getRawValue().correo;

        this.authService.recuperarContrasena(correo).subscribe({

            next: (response) => {

                this.cargandoRecuperacion = false;

                this.mensajeRecuperacion = response;

                this.changeDetectorRef.detectChanges();

            },

            error: (error) => {

                this.cargandoRecuperacion = false;

                console.error(
                    'Error al solicitar recuperación de contraseña:',
                    error
                );

                this.errorRecuperacion =
                    'No fue posible procesar la solicitud. Inténtalo nuevamente.';

                this.changeDetectorRef.detectChanges();

            }

        });
    }
}