import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, finalize, forkJoin, of } from 'rxjs';

import { CatalogRecord, CatalogResource, CatalogoResourceApiService } from './catalogo-resource-api.service';

interface ResourceConfig {
    resource: Exclude<CatalogResource, 'categoria'>;
    titulo: string;
    singular: string;
    idKey: string;
    fieldKey: string;
    fieldAliases?: string[];
    fieldLabel: string;
    parentKey?: string;
    parentResource?: CatalogResource;
    parentIdKey?: string;
    parentLabelKey?: string;
    parentLabel?: string;
}

const RESOURCE_CONFIGS: Record<Exclude<CatalogResource, 'categoria'>, ResourceConfig> = {
    subcategoria: {
        resource: 'subcategoria',
        titulo: 'Subcategorías',
        singular: 'subcategoría',
        idKey: 'idSubcategoria',
        fieldKey: 'nombreSubCategoria',
        fieldAliases: ['nombreSubcategoria'],
        fieldLabel: 'Nombre de la subcategoría',
        parentKey: 'idCategoria',
        parentResource: 'categoria',
        parentIdKey: 'idCategoria',
        parentLabelKey: 'nombreCategoria',
        parentLabel: 'Categoría'
    },
    marca: {
        resource: 'marca',
        titulo: 'Marcas',
        singular: 'marca',
        idKey: 'idMarca',
        fieldKey: 'nombreMarca',
        fieldLabel: 'Nombre de la marca'
    },
    atributo: {
        resource: 'atributo',
        titulo: 'Atributos',
        singular: 'atributo',
        idKey: 'idAtributo',
        fieldKey: 'nombreAtributo',
        fieldLabel: 'Nombre del atributo'
    },
    valorAtributo: {
        resource: 'valorAtributo',
        titulo: 'Valores de atributos',
        singular: 'valor de atributo',
        idKey: 'idValorAtributo',
        fieldKey: 'valor',
        fieldLabel: 'Valor',
        parentKey: 'idAtributo',
        parentResource: 'atributo',
        parentIdKey: 'idAtributo',
        parentLabelKey: 'nombreAtributo',
        parentLabel: 'Atributo'
    }
};

@Component({
    selector: 'app-erp-catalogo-recurso',
    imports: [ReactiveFormsModule],
    templateUrl: './catalogo-recurso.component.html',
    styleUrl: './catalogo-recurso.component.css'
})
export class CatalogoRecursoERPComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly api = inject(CatalogoResourceApiService);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private cargaActual?: Subscription;

    protected readonly config = signal<ResourceConfig>(RESOURCE_CONFIGS.subcategoria);
    protected readonly registros = signal<CatalogRecord[]>([]);
    protected readonly opcionesPadre = signal<CatalogRecord[]>([]);
    protected readonly cargando = signal(true);
    protected readonly cargandoPadres = signal(false);
    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly mensaje = signal('');
    protected readonly idEnEdicion = signal<string | null>(null);
    protected readonly registroPorEliminar = signal<CatalogRecord | null>(null);
    protected readonly tituloFormulario = computed(() => this.idEnEdicion()
        ? `Editar ${this.config().singular}`
        : `Crear ${this.config().singular}`);

    protected readonly formulario = this.formBuilder.nonNullable.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        parentId: ['', Validators.required]
    });

    ngOnInit(): void {
        this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
            const resource = data['resource'] as Exclude<CatalogResource, 'categoria'> | undefined;
            if (!resource || !RESOURCE_CONFIGS[resource]) {
                return;
            }

            this.config.set(RESOURCE_CONFIGS[resource]);
            this.limpiarFormulario();
            this.registros.set([]);
            this.opcionesPadre.set([]);
            this.mensaje.set('');
            this.error.set('');
            this.cargarDatos();
        });
    }

    protected cargarDatos(): void {
        const config = this.config();
        this.cargaActual?.unsubscribe();
        this.cargando.set(true);
        this.cargandoPadres.set(Boolean(config.parentResource));
        this.error.set('');

        let erroresCarga: HttpErrorResponse[] = [];
        const registros$ = this.api.listar(config.resource).pipe(
            catchError((error: HttpErrorResponse) => {
                erroresCarga.push(error);
                return of([]);
            })
        );
        const padres$ = config.parentResource
            ? this.api.listar(config.parentResource).pipe(
                catchError((error: HttpErrorResponse) => {
                    erroresCarga.push(error);
                    return of([]);
                })
            )
            : of([]);

        this.cargaActual = forkJoin({ registros: registros$, padres: padres$ }).pipe(
            finalize(() => {
                this.cargando.set(false);
                this.cargandoPadres.set(false);
                this.changeDetectorRef.markForCheck();
            })
        ).subscribe(({ registros, padres }) => {
            this.registros.set(registros.map((registro) => this.normalizarRegistro(registro)));
            this.opcionesPadre.set(padres);
            if (erroresCarga.length) {
                this.error.set(erroresCarga.map((error) => this.mensajeError(error)).join(' '));
            }
            this.changeDetectorRef.markForCheck();
        });
    }

    protected guardar(): void {
        this.error.set('');
        this.mensaje.set('');
        const config = this.config();

        if (this.formulario.controls.nombre.invalid) {
            this.formulario.controls.nombre.markAsTouched();
            return;
        }

        if (config.parentKey && this.formulario.controls.parentId.invalid) {
            this.formulario.controls.parentId.markAsTouched();
            return;
        }

        const nombre = this.formulario.controls.nombre.value.trim();
        if (!nombre) {
            this.formulario.controls.nombre.setErrors({ required: true });
            return;
        }

        const id = this.idEnEdicion();
        const payload: CatalogRecord = { [config.fieldKey]: nombre };
        if (id && config.parentKey) {
            payload[config.parentKey] = this.formulario.controls.parentId.value;
        }

        const operation = id
            ? this.api.actualizar(config.resource, id, payload)
            : this.api.crear(
                config.resource,
                payload,
                config.parentKey ? this.formulario.controls.parentId.value : undefined
            );

        this.guardando.set(true);
        operation.pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: (registro) => {
                this.mensaje.set(`Se ${id ? 'actualizó' : 'creó'} ${config.singular} correctamente.`);
                this.limpiarFormulario();
                if (registro && registro[config.idKey]) {
                    const registroNormalizado = this.normalizarRegistro(registro);
                    this.registros.update((actuales) => id
                        ? actuales.map((item) => item[config.idKey] === id ? registroNormalizado : item)
                        : [...actuales, registroNormalizado]);
                } else {
                    this.cargarDatos();
                }
                this.changeDetectorRef.markForCheck();
            },
            error: (error: HttpErrorResponse) => {
                this.error.set(this.mensajeError(error));
                this.changeDetectorRef.markForCheck();
            }
        });
        this.changeDetectorRef.markForCheck();
    }

    protected editar(registro: CatalogRecord): void {
        const config = this.config();
        registro = this.normalizarRegistro(registro);
        this.error.set('');
        this.mensaje.set('');
        this.idEnEdicion.set(registro[config.idKey] ?? null);
        this.formulario.setValue({
            nombre: registro[config.fieldKey] ?? '',
            parentId: config.parentKey ? registro[config.parentKey] ?? '' : ''
        });
    }

    protected solicitarEliminacion(registro: CatalogRecord): void {
        this.error.set('');
        this.mensaje.set('');
        this.registroPorEliminar.set(registro);
    }

    protected eliminarConfirmado(): void {
        const registro = this.registroPorEliminar();
        const config = this.config();
        const id = registro?.[config.idKey];
        if (!registro || !id) {
            return;
        }

        this.guardando.set(true);
        this.api.eliminar(config.resource, id).pipe(
            finalize(() => this.guardando.set(false))
        ).subscribe({
            next: () => {
                this.registros.update((actuales) => actuales.filter((item) => item[config.idKey] !== id));
                this.mensaje.set(`Se eliminó ${config.singular} correctamente.`);
                this.registroPorEliminar.set(null);
                if (this.idEnEdicion() === id) {
                    this.limpiarFormulario();
                }
            },
            error: (error: HttpErrorResponse) => {
                this.registroPorEliminar.set(null);
                this.error.set(this.mensajeError(error));
            }
        });
        this.changeDetectorRef.markForCheck();
    }

    protected cancelar(): void {
        this.limpiarFormulario();
        this.error.set('');
        this.mensaje.set('');
        this.registroPorEliminar.set(null);
    }

    protected nombrePadre(registro: CatalogRecord): string {
        const config = this.config();
        const parentId = config.parentKey ? registro[config.parentKey] : undefined;
        const option = this.opcionesPadre().find((item) => item[config.parentIdKey ?? ''] === parentId);
        return option?.[config.parentLabelKey ?? ''] ?? parentId ?? '—';
    }

    protected id(registro: CatalogRecord): string {
        return registro[this.config().idKey] ?? '';
    }

    protected trackKey(registro: CatalogRecord, index: number): string {
        const id = this.id(registro);
        if (id) {
            return id;
        }

        const config = this.config();
        return `${registro[config.parentKey ?? ''] ?? ''}:${this.nombre(registro)}:${index}`;
    }

    protected nombre(registro: CatalogRecord): string {
        return registro[this.config().fieldKey] ?? '';
    }

    private limpiarFormulario(): void {
        this.formulario.reset({ nombre: '', parentId: '' });
        this.idEnEdicion.set(null);
    }

    private normalizarRegistro(registro: CatalogRecord): CatalogRecord {
        const config = this.config();
        const fieldValue = registro[config.fieldKey]
            ?? config.fieldAliases?.map((key) => registro[key]).find(Boolean);
        return fieldValue ? { ...registro, [config.fieldKey]: fieldValue } : registro;
    }

    private mensajeError(error: HttpErrorResponse): string {
        if (error.status === 0) {
            return 'No se pudo conectar con el servidor. Comprueba que Spring Boot esté activo.';
        }
        if (error.status === 401) {
            const detalle = error.error as { code?: string; response?: unknown; message?: string } | null;
            if (detalle?.code === 'ENDPOINT_UNAUTHORIZED') {
                const body = this.detalleRespuesta(detalle.response);
                return `Spring Boot rechazó ${error.url ?? 'este endpoint'} con 401 incluso después de renovar la sesión. Revisa su ruta y autorización.${body}`;
            }
            return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
        }
        if (error.status === 409) {
            return `Ya existe un registro con ese ${this.config().fieldLabel.toLocaleLowerCase('es')}.`;
        }

        const detalle = error.error as { mensaje?: string; message?: string } | string | null;
        if (typeof detalle === 'string' && detalle.trim()) {
            return detalle;
        }
        if (detalle && typeof detalle === 'object') {
            return detalle.mensaje ?? detalle.message ?? 'Ocurrió un error al procesar el registro.';
        }
        return 'Ocurrió un error al procesar el registro.';
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