import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ConfirmationDialogComponent } from '../../../../shared/confirmation-dialog/confirmation-dialog.component';
import {
    CatalogRecord,
    CatalogoResourceApiService
} from '../catalogo-resource-api.service';

export type RecursoRelacionado = 'subcategoria' | 'valorAtributo';

@Component({
    selector: 'app-recursos-relacionados-modal',
    imports: [ReactiveFormsModule, ConfirmationDialogComponent],
    templateUrl: './recursos-relacionados-modal.component.html',
    styleUrl: './recursos-relacionados-modal.component.css'
})
export class RecursosRelacionadosModalComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly api = inject(CatalogoResourceApiService);

    readonly recurso = input.required<RecursoRelacionado>();
    readonly idPadre = input.required<string>();
    readonly nombrePadre = input.required<string>();

    readonly cerrado = output<void>();
    readonly cambiosRealizados = output<void>();

    protected readonly registros = signal<CatalogRecord[]>([]);
    protected readonly cargando = signal(true);
    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly mensaje = signal('');
    protected readonly idEnEdicion = signal<string | null>(null);
    protected readonly registroPorEliminar = signal<CatalogRecord | null>(null);

    protected readonly formulario = this.formBuilder.nonNullable.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]]
    });

    protected get esSubcategoria(): boolean {
        return this.recurso() === 'subcategoria';
    }

    protected get titulo(): string {
        return this.esSubcategoria ? 'Subcategorías' : 'Valores del atributo';
    }

    protected get singular(): string {
        return this.esSubcategoria ? 'subcategoría' : 'valor';
    }

    protected get campoNombre(): string {
        return this.esSubcategoria ? 'nombreSubCategoria' : 'valor';
    }

    protected get campoId(): string {
        return this.esSubcategoria ? 'idSubCategoria' : 'idValorAtributo';
    }

    protected get tituloFormulario(): string {
        return this.idEnEdicion()
            ? `Editar ${this.singular}`
            : `Crear ${this.singular}`;
    }

    ngOnInit(): void {
        this.cargarRegistros();
    }

    protected cargarRegistros(): void {
        this.cargando.set(true);
        this.error.set('');

        const peticion = this.esSubcategoria
            ? this.api.listarSubcategoriasPorCategoria(this.idPadre())
            : this.api.listarValoresPorAtributo(this.idPadre());

        peticion.pipe(
            finalize(() => this.cargando.set(false))
        ).subscribe({
            next: (registros) => {
                this.registros.set(registros);
            },
            error: (error: HttpErrorResponse) => {
                this.error.set(this.mensajeError(error));
            }
        });
    }

    protected nombre(registro: CatalogRecord): string {
        return registro[this.campoNombre]
            ?? (this.esSubcategoria ? registro['nombreSubcategoria'] : undefined)
            ?? '';
    }

    protected trackKey(registro: CatalogRecord, index: number): string {
        return registro[this.campoId] || `${this.nombre(registro)}-${index}`;
    }


    protected guardar(): void {
        this.error.set('');
        this.mensaje.set('');

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const nombre = this.formulario.controls.nombre.value.trim();

        if (!nombre) {
            this.formulario.controls.nombre.setErrors({ required: true });
            return;
        }

        const id = this.idEnEdicion();

        const payload: CatalogRecord = {
            [this.campoNombre]: nombre
        };

        this.guardando.set(true);

        if (id) {
            this.api.actualizar(
                this.recurso(),
                id,
                payload,
                this.idPadre()
            ).pipe(
                finalize(() => this.guardando.set(false))
            ).subscribe({
                next: () => {
                    this.mensaje.set(
                        `La ${this.singular} se actualizó correctamente.`
                    );

                    this.limpiarFormulario();
                    this.cargarRegistros();
                    this.cambiosRealizados.emit();
                },
                error: (error: HttpErrorResponse) => {
                    this.error.set(this.mensajeError(error));
                }
            });

            return;
        }

        this.api.crear(
            this.recurso(),
            payload,
            this.idPadre()
        ).pipe(
            finalize(() => this.guardando.set(false))
        ).subscribe({
            next: () => {
                this.mensaje.set(
                    `La ${this.singular} se creó correctamente.`
                );

                this.limpiarFormulario();
                this.cargarRegistros();
                this.cambiosRealizados.emit();
            },
            error: (error: HttpErrorResponse) => {
                this.error.set(this.mensajeError(error));
            }
        });
    }


    protected editar(registro: CatalogRecord): void {
        const id = registro[this.campoId];
        console.log('Registro seleccionado:', registro);
        if (!id) {
            this.error.set('No se encontró el identificador del registro.');
            return;
        }

        this.error.set('');
        this.mensaje.set('');
        this.idEnEdicion.set(id);
        this.formulario.setValue({ nombre: this.nombre(registro) });
    }

    protected cancelarEdicion(): void {
        this.limpiarFormulario();
        this.error.set('');
        this.mensaje.set('');
    }

    protected solicitarEliminacion(registro: CatalogRecord): void {
        this.registroPorEliminar.set(registro);
        this.error.set('');
        this.mensaje.set('');
    }

    protected eliminarConfirmado(): void {
        const registro = this.registroPorEliminar();
        const id = registro?.[this.campoId];

        if (!registro || !id) {
            return;
        }

        this.guardando.set(true);

        this.api.eliminar(this.recurso(), id).pipe(
            finalize(() => this.guardando.set(false))
        ).subscribe({
            next: () => {
                this.registros.update(actuales =>
                    actuales.filter(item => item[this.campoId] !== id)
                );

                if (this.idEnEdicion() === id) {
                    this.limpiarFormulario();
                }

                this.registroPorEliminar.set(null);
                this.mensaje.set(`Se eliminó "${this.nombre(registro)}".`);
                this.cambiosRealizados.emit();
            },
            error: (error: HttpErrorResponse) => {
                this.registroPorEliminar.set(null);
                this.error.set(this.mensajeError(error));
            }
        });
    }

    protected cancelarEliminacion(): void {
        this.registroPorEliminar.set(null);
    }

    protected cerrar(): void {
        if (!this.guardando()) {
            this.cerrado.emit();
        }
    }

    private limpiarFormulario(): void {
        this.formulario.reset({ nombre: '' });
        this.idEnEdicion.set(null);
    }

    private mensajeError(error: HttpErrorResponse): string {
        if (error.status === 0) {
            return 'No se pudo conectar con el servidor.';
        }

        if (error.status === 401) {
            return 'Tu sesión expiró. Inicia sesión nuevamente.';
        }

        const detalle = error.error as {
            mensaje?: string;
            message?: string;
        } | string | null;

        if (typeof detalle === 'string' && detalle.trim()) {
            return detalle;
        }

        if (detalle && typeof detalle === 'object') {
            return detalle.mensaje
                ?? detalle.message
                ?? `Ocurrió un error al procesar la ${this.singular}.`;
        }

        return `Ocurrió un error al procesar la ${this.singular}.`;
    }
}