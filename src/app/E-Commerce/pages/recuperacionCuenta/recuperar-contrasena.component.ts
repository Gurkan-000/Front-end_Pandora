import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-recuperar-contrasena',
    standalone: true,
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './recuperar-contrasena.component.html',
    styleUrl: './recuperar-contrasena.component.css'
})
export class RecuperarContrasenaComponent {

    private readonly formBuilder = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    token = '';

    cargando = false;

    error = '';

    mensaje = '';

    formularioEnviado = false;

    recuperarForm = this.formBuilder.nonNullable.group({
        contrasenaNueva: [
            '',
            [
                Validators.required,
                Validators.minLength(6)
            ]
        ],
        contrasenaConfirmada: [
            '',
            [
                Validators.required,
                Validators.minLength(6)
            ]
        ]
    });


    constructor() {

        this.activatedRoute.queryParamMap.subscribe(params => {

            this.token = params.get('token') ?? '';

            if (!this.token) {

                this.error =
                    'El enlace de recuperación no contiene un token válido.';

            }

        });

    }


    cambiarContrasena(): void {

        this.error = '';

        this.mensaje = '';

        this.formularioEnviado = true;


        if (!this.token) {

            this.error =
                'El enlace de recuperación no es válido o está incompleto.';

            this.changeDetectorRef.detectChanges();

            return;
        }


        if (this.recuperarForm.invalid) {

            this.recuperarForm.markAllAsTouched();

            return;
        }


        const {
            contrasenaNueva,
            contrasenaConfirmada
        } = this.recuperarForm.getRawValue();


        if (contrasenaNueva !== contrasenaConfirmada) {

            this.error =
                'Las contraseñas no coinciden. Verifica que ambas sean iguales.';

            this.changeDetectorRef.detectChanges();

            return;
        }


        this.cargando = true;


        const request = {
            token: this.token,
            contrasenaNueva: contrasenaNueva,
            contrasenaConfirmada: contrasenaConfirmada
        };


        this.authService.confirmarContrasena(request).subscribe({

            next: (response) => {

                this.cargando = false;

                this.mensaje =
                    'Tu contraseña ha sido actualizada correctamente.';

                this.formularioEnviado = false;

                this.changeDetectorRef.detectChanges();


                setTimeout(() => {

                    this.router.navigate(['/login']);

                }, 2000);

            },


            error: (error) => {

                this.cargando = false;

                console.error(
                    'Error al cambiar la contraseña:',
                    error
                );


                if (error.status === 400) {

                    this.error =
                        error.error?.mensaje ??
                        error.error ??
                        'El enlace de recuperación no es válido o ha expirado.';

                } else {

                    this.error =
                        'No fue posible cambiar la contraseña. Inténtalo nuevamente.';

                }


                this.changeDetectorRef.detectChanges();

            }

        });

    }


    volverAlLogin(): void {

        this.router.navigate(['/login']);

    }

}