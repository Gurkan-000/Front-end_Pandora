import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { CategoriaApiService } from './categoria-api.service';
import { Categoria } from './categoria.interface';

@Component({
    selector: 'app-erp-categorias',
    imports: [ReactiveFormsModule],
    templateUrl: './categoria.component.html',
    styleUrl: './categoria.component.css'
})
export class CategoriaERPComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly categoriaApi = inject(CategoriaApiService);

    protected readonly categorias = signal<Categoria[]>([]);
    protected readonly cargando = signal(true);
    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly mensaje = signal('');
    protected readonly idEnEdicion = signal<string | null>(null);
    protected readonly categoriaPorEliminar = signal<Categoria | null>(null);

    protected readonly formulario = this.formBuilder.nonNullable.group({
        nombreCategoria: ['', [Validators.required, Validators.maxLength(100)]]
    });

    ngOnInit(): void {
        this.cargarCategorias();
    }

    protected cargarCategorias(): void {
        this.cargando.set(true);
        this.error.set('');

        this.categoriaApi.listar().pipe(
            finalize(() => this.cargando.set(false))
        ).subscribe({
            next: (categorias) => this.categorias.set(categorias),
            error: (error: HttpErrorResponse) => this.error.set(this.mensajeError(error))
        });
    }

    protected guardar(): void {
        this.mensaje.set('');
        this.error.set('');

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const id = this.idEnEdicion();
        const request = {
            nombreCategoria: this.formulario.controls.nombreCategoria.value.trim()
        };

        if (!request.nombreCategoria) {
            this.formulario.controls.nombreCategoria.setErrors({ required: true });
            return;
        }

        this.guardando.set(true);
        const operacion = id
            ? this.categoriaApi.actualizar(id, request)
            : this.categoriaApi.crear(request);

        operacion.pipe(
            finalize(() => this.guardando.set(false))
        ).subscribe({
            next: (categoria) => {
                this.mensaje.set(id ? 'La categoría se actualizó correctamente.' : 'La categoría se creó correctamente.');
                this.limpiarFormulario();

                if (categoria?.idCategoria) {
                    this.categorias.update((actuales) => id
                        ? actuales.map((item) => item.idCategoria === id ? categoria : item)
                        : [...actuales, categoria]);
                } else {
                    this.cargarCategorias();
                }
            },
            error: (error: HttpErrorResponse) => this.error.set(this.mensajeError(error))
        });
    }

    protected trackKey(categoria: Categoria, index: number): string {
        return categoria.idCategoria || `${categoria.nombreCategoria}:${index}`;
    }

    protected editar(categoria: Categoria): void {
        this.error.set('');
        this.mensaje.set('');
        this.idEnEdicion.set(categoria.idCategoria);
        this.formulario.setValue({ nombreCategoria: categoria.nombreCategoria });
    }

    protected cancelarEdicion(): void {
        this.limpiarFormulario();
        this.error.set('');
        this.mensaje.set('');
    }

    protected solicitarEliminacion(categoria: Categoria): void {
        this.categoriaPorEliminar.set(categoria);
        this.error.set('');
        this.mensaje.set('');
    }

    protected eliminarConfirmado(): void {
        const categoria = this.categoriaPorEliminar();
        if (!categoria) {
            return;
        }

        this.guardando.set(true);
        this.categoriaApi.eliminar(categoria.idCategoria).pipe(
            finalize(() => this.guardando.set(false))
        ).subscribe({
            next: () => {
                this.categorias.update((actuales) => actuales.filter(
                    (item) => item.idCategoria !== categoria.idCategoria
                ));
                this.mensaje.set(`Se eliminó la categoría "${categoria.nombreCategoria}".`);
                this.categoriaPorEliminar.set(null);

                if (this.idEnEdicion() === categoria.idCategoria) {
                    this.limpiarFormulario();
                }
            },
            error: (error: HttpErrorResponse) => {
                this.categoriaPorEliminar.set(null);
                this.error.set(this.mensajeError(error));
            }
        });
    }

    protected cancelarEliminacion(): void {
        this.categoriaPorEliminar.set(null);
    }

    private limpiarFormulario(): void {
        this.formulario.reset({ nombreCategoria: '' });
        this.idEnEdicion.set(null);
    }

    private mensajeError(error: HttpErrorResponse): string {
        if (error.status === 0) {
            return 'No se pudo conectar con el servidor. Comprueba que Spring Boot esté activo.';
        }

        if (error.status === 401) {
            const detalle = error.error as { code?: string; response?: unknown } | null;
            if (detalle?.code === 'ENDPOINT_UNAUTHORIZED') {
                const body = this.detalleRespuesta(detalle.response);
                return `Spring Boot rechazó ${error.url ?? 'este endpoint'} con 401 incluso después de renovar la sesión. Revisa su ruta y autorización.${body}`;
            }
            return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
        }

        if (error.status === 409) {
            return 'Ya existe una categoría con ese nombre.';
        }

        const detalle = error.error as { mensaje?: string; message?: string } | string | null;
        if (typeof detalle === 'string' && detalle.trim()) {
            return detalle;
        }

        if (detalle && typeof detalle === 'object') {
            return detalle.mensaje ?? detalle.message ?? 'Ocurrió un error al procesar la categoría.';
        }

        return 'Ocurrió un error al procesar la categoría.';
    }

    private detalleRespuesta(response: unknown): string {
        if (typeof response === 'string' && response.trim()) {
            return ` Respuesta: ${response}`;
        }
        if (response && typeof response === 'object') {
            const detalle = response as { mensaje?: string; message?: string; error?: string; detail?: string };
            const mensaje = detalle.mensaje ?? detalle.message ?? detalle.error ?? detalle.detail;
            return mensaje ? ` Respuesta: ${mensaje}` : '';
        }
        return '';
    }
}