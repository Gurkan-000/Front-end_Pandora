
import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    inject,
    signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ProductosService } from '../../../../../services/productos.service';
import { ResponseAtributo } from '../../../../../interfaces/crear-producto.interface';
import {
    ResponseValorAtributo,
    ResponseVarianteProducto
} from '../../../../../interfaces/response-variante-producto.interface';
import {
    ActualizarVarianteProductoRequest,
    CrearVarianteProductoRequest
} from '../../../../../interfaces/crear-variante-producto.interface';

interface AtributoConValores {
    atributo: ResponseAtributo;
    valores: ResponseValorAtributo[];
}

@Component({
    selector: 'app-crear-varianteproducto-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './crear-varianteproducto-modal.component.html',
    styleUrl: './crear-varianteproducto-modal.component.css'
})
export class CrearVarianteProductoModalComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly productosService = inject(ProductosService);

    @Input({ required: true }) idProducto!: string;
    @Input() variante: ResponseVarianteProducto | null = null;
    @Input() cantidadVariantes = 0;

    @Output() cerrar = new EventEmitter<void>();
    @Output() varianteCreada = new EventEmitter<void>();

    readonly baseUrl = 'http://localhost:8080';

    readonly atributosConValores = signal<AtributoConValores[]>([]);
    readonly valoresSeleccionados = signal<Record<string, string>>({});

    readonly cargandoAtributos = signal(true);
    readonly creandoVariante = signal(false);
    readonly errorCarga = signal('');
    readonly errorFormulario = signal('');
    readonly mensajeExito = signal('');

    readonly modalImagenAbierto = signal(false);
    readonly archivoNuevaImagen = signal<File | null>(null);
    readonly vistaPreviaNuevaImagen = signal<string | null>(null);
    readonly cambiandoImagen = signal(false);
    readonly errorImagen = signal('');
    readonly mensajeImagen = signal('');

    readonly imagenPrevisualizacion = signal<string | null>(null);
    readonly archivoImagen = signal<File | null>(null);

    readonly formulario = this.fb.nonNullable.group({
        stock: [0, [Validators.required, Validators.min(0)]],
        esPrincipal: [false]
    });

    get esEdicion(): boolean {
        return this.variante !== null;
    }

    ngOnInit(): void {
        this.formulario.controls.esPrincipal.setValue(
            this.cantidadVariantes === 0
        );

        this.cargarAtributosYValores();
    }

    cargarAtributosYValores(): void {

        this.cargandoAtributos.set(true);
        this.errorCarga.set('');

        this.productosService.listarAtributosProducto(this.idProducto)
            .subscribe({
                next: (atributos) => {
                    if (atributos.length === 0) {
                        this.atributosConValores.set([]);
                        this.cargandoAtributos.set(false);
                        return;
                    }

                    forkJoin(
                        atributos.map((atributo) =>
                            this.productosService
                                .listarValoresAtributo(atributo.idAtributo)
                        )
                    ).subscribe({
                        next: (listasValores) => {
                            this.atributosConValores.set(
                                atributos.map((atributo, index) => ({
                                    atributo,
                                    valores: listasValores[index]
                                }))
                            );

                            if (this.variante) {

                                const seleccionados: Record<string, string> = {};

                                for (const valorAtributo of this.variante.atributos) {
                                    seleccionados[valorAtributo.idAtributo] =
                                        valorAtributo.idValorAtributo;
                                }

                                this.valoresSeleccionados.set(seleccionados);

                                this.formulario.patchValue({
                                    stock: this.variante.stock,
                                    esPrincipal: this.variante.esPrincipal
                                });

                                this.imagenPrevisualizacion.set(
                                    this.variante.urlImagen
                                        ? `${this.baseUrl}${this.variante.urlImagen}`
                                        : null
                                );

                                this.archivoImagen.set(null);
                            } else {
                                this.valoresSeleccionados.set({});
                                this.archivoImagen.set(null);
                                this.imagenPrevisualizacion.set(null);

                                this.formulario.reset({
                                    stock: 0,
                                    esPrincipal: this.cantidadVariantes === 0
                                });
                            }

                            this.cargandoAtributos.set(false);
                        },
                        error: (error) => {
                            console.error(
                                'Error al cargar los valores de atributos:',
                                error
                            );
                            this.errorCarga.set(
                                'No fue posible cargar los valores de los atributos.'
                            );
                            this.cargandoAtributos.set(false);
                        }
                    });
                },
                error: (error) => {
                    console.error(
                        'Error al cargar los atributos del producto:',
                        error
                    );
                    this.errorCarga.set(
                        'No fue posible cargar los atributos del producto.'
                    );
                    this.cargandoAtributos.set(false);
                }
            });
    }

    seleccionarValor(idAtributo: string, idValorAtributo: string): void {
        this.valoresSeleccionados.update((actuales) => ({
            ...actuales,
            [idAtributo]: idValorAtributo
        }));

        this.errorFormulario.set('');
        this.mensajeExito.set('');
    }

    seleccionarImagen(event: Event): void {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];

        if (!archivo) {
            return;
        }

        if (!archivo.type.startsWith('image/')) {
            this.errorFormulario.set(
                'Selecciona un archivo de imagen válido.'
            );
            input.value = '';
            return;
        }

        this.archivoImagen.set(archivo);
        this.errorFormulario.set('');
        this.mensajeExito.set('');

        const lector = new FileReader();

        lector.onload = () => {
            this.imagenPrevisualizacion.set(lector.result as string);
        };

        lector.readAsDataURL(archivo);
    }

    quitarImagen(): void {
        this.archivoImagen.set(null);
        this.imagenPrevisualizacion.set(null);
    }

    enviarFormulario(): void {
        if (this.creandoVariante()) {
            return;
        }

        this.errorFormulario.set('');
        this.mensajeExito.set('');
        this.formulario.markAllAsTouched();

        if (this.formulario.invalid) {
            this.errorFormulario.set(
                'El stock debe ser un número igual o mayor que cero.'
            );
            return;
        }

        const atributos = this.atributosConValores();

        if (atributos.length === 0) {
            this.errorFormulario.set(
                'El producto debe tener al menos un atributo configurado.'
            );
            return;
        }

        const seleccionados = this.valoresSeleccionados();

        const todosSeleccionados = atributos.every(
            ({ atributo }) => Boolean(seleccionados[atributo.idAtributo])
        );

        if (!todosSeleccionados) {
            this.errorFormulario.set(
                'Selecciona un valor para cada atributo.'
            );
            return;
        }

        const idsValores = atributos.map(
            ({ atributo }) => seleccionados[atributo.idAtributo]
        );

        const { stock, esPrincipal } = this.formulario.getRawValue();

        this.creandoVariante.set(true);

        if (this.variante) {
            const request: ActualizarVarianteProductoRequest = {
                idValorAtributos: idsValores,
                stock,
                urlImagen: this.variante.urlImagen,
                esPrincipal
            };

            console.log("" + this.variante.urlImagen);

            this.productosService.actualizarVarianteProducto(
                this.variante.idVarianteProducto,
                this.idProducto,
                request
            ).subscribe({
                next: () => {
                    this.creandoVariante.set(false);
                    this.varianteCreada.emit();
                    this.cerrar.emit();
                },
                error: (error) => {
                    console.error('Error al actualizar variante:', error);
                    this.errorFormulario.set(
                        'No fue posible actualizar la variante. Revisa los datos e inténtalo nuevamente.'
                    );
                    this.creandoVariante.set(false);
                }
            });

            return;
        }

        if (this.archivoImagen()) {
            this.productosService.subirImagen(this.archivoImagen()!)
                .subscribe({
                    next: (respuestaImagen) => {
                        this.crearVariante(
                            idsValores,
                            stock,
                            esPrincipal,
                            respuestaImagen.urlImagen
                        );
                    },
                    error: (error) => {
                        console.error(
                            'Error al subir la imagen de la variante:',
                            error
                        );
                        this.errorFormulario.set(
                            'No fue posible subir la imagen. La variante no se creó.'
                        );
                        this.creandoVariante.set(false);
                    }
                });

            return;
        }

        this.crearVariante(idsValores, stock, esPrincipal, null);
    }

    private crearVariante(
        idValorAtributos: string[],
        stock: number,
        esPrincipal: boolean,
        urlImagen: string | null
    ): void {
        const request: CrearVarianteProductoRequest = {
            idValorAtributos,
            stock,
            urlImagen,
            esPrincipal
        };

        this.productosService
            .crearVarianteProducto(this.idProducto, request)
            .subscribe({
                next: () => {
                    this.creandoVariante.set(false);
                    this.varianteCreada.emit();

                    this.formulario.reset({
                        stock: 0,
                        esPrincipal: false
                    });

                    this.valoresSeleccionados.set({});
                    this.archivoImagen.set(null);
                    this.imagenPrevisualizacion.set(null);
                    this.errorFormulario.set('');

                    this.mensajeExito.set(
                        'Variante creada correctamente. Puedes registrar otra.'
                    );
                },
                error: (error) => {
                    console.error('Error al crear la variante:', error);

                    if (urlImagen) {
                        this.eliminarImagenSiExiste(urlImagen);
                    }

                    this.errorFormulario.set(
                        this.obtenerMensajeError(error)
                    );
                    this.creandoVariante.set(false);
                }
            });
    }

    private eliminarImagenSiExiste(urlImagen: string): void {
        const nombreImagen = urlImagen.split('/').pop();

        if (!nombreImagen) {
            return;
        }

        this.productosService.eliminarImagen(nombreImagen).subscribe({
            error: (error) => {
                console.error(
                    'No se pudo eliminar la imagen subida para la variante:',
                    error
                );
            }
        });
    }

    private obtenerMensajeError(error: any): string {
        const detalle = error?.error;

        if (typeof detalle === 'string' && detalle.trim()) {
            return detalle;
        }

        if (detalle && typeof detalle === 'object') {
            return detalle.mensaje
                ?? detalle.message
                ?? 'No fue posible crear la variante.';
        }

        return 'No fue posible crear la variante. Inténtalo nuevamente.';
    }

    cerrarModal(): void {
        if (this.creandoVariante()) {
            return;
        }

        this.cerrar.emit();
    }

    abrirModalImagen(): void {
        if (!this.variante || this.creandoVariante()) {
            return;
        }

        this.archivoNuevaImagen.set(null);
        this.vistaPreviaNuevaImagen.set(null);
        this.errorImagen.set('');
        this.mensajeImagen.set('');
        this.modalImagenAbierto.set(true);
    }

    cerrarModalImagen(): void {
        if (this.cambiandoImagen()) {
            return;
        }

        this.modalImagenAbierto.set(false);
        this.archivoNuevaImagen.set(null);
        this.vistaPreviaNuevaImagen.set(null);
        this.errorImagen.set('');
    }

    seleccionarNuevaImagen(event: Event): void {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];

        if (!archivo) {
            return;
        }

        if (!archivo.type.startsWith('image/')) {
            this.errorImagen.set('Selecciona un archivo de imagen válido.');
            input.value = '';
            return;
        }

        this.archivoNuevaImagen.set(archivo);
        this.errorImagen.set('');
        this.mensajeImagen.set('');

        const lector = new FileReader();

        lector.onload = () => {
            this.vistaPreviaNuevaImagen.set(lector.result as string);
        };

        lector.onerror = () => {
            this.archivoNuevaImagen.set(null);
            this.vistaPreviaNuevaImagen.set(null);
            this.errorImagen.set('No fue posible previsualizar la imagen.');
        };

        lector.readAsDataURL(archivo);
    }

    guardarNuevaImagen(): void {
        const varianteActual = this.variante;
        const archivo = this.archivoNuevaImagen();

        if (!varianteActual || !archivo || this.cambiandoImagen()) {
            if (!archivo) {
                this.errorImagen.set('Selecciona una imagen antes de continuar.');
            }
            return;
        }

        this.cambiandoImagen.set(true);
        this.errorImagen.set('');
        this.mensajeImagen.set('');

        const urlAnterior = varianteActual.urlImagen;

        // 1. Subir la nueva imagen.
        this.productosService.subirImagen(archivo).subscribe({
            next: (respuesta) => {
                const urlNueva = respuesta.urlImagen;

                // 2. Actualizar exclusivamente la URL mediante PATCH.
                this.productosService.actualizarUrlImagenVariante(
                    varianteActual.idVarianteProducto,
                    urlNueva
                ).subscribe({
                    next: () => {
                        // El PATCH tuvo éxito: actualizamos la variante local.
                        this.variante = {
                            ...varianteActual,
                            urlImagen: urlNueva
                        };

                        this.imagenPrevisualizacion.set(
                            `${this.baseUrl}${urlNueva}`
                        );

                        // Actualizar la lista de variantes en el componente padre.
                        this.varianteCreada.emit();

                        // 3. La imagen anterior solo se elimina después del PATCH.
                        if (urlAnterior && urlAnterior !== urlNueva) {
                            this.productosService.eliminarImagen(
                                this.obtenerNombreImagen(urlAnterior)
                            ).subscribe({
                                next: () => {
                                    this.finalizarCambioImagen();
                                },
                                error: (error) => {
                                    console.error(
                                        'La imagen se actualizó, pero no se pudo eliminar la anterior:',
                                        error
                                    );

                                    this.finalizarCambioImagen(
                                        'La imagen se actualizó, pero no se pudo eliminar el archivo anterior.'
                                    );
                                }
                            });
                        } else {
                            this.finalizarCambioImagen();
                        }
                    },
                    error: (error) => {
                        console.error(
                            'Error al actualizar la URL de la variante:',
                            error
                        );

                        // El PATCH falló: la imagen anterior sigue asociada.
                        // Intentamos limpiar el archivo recién subido.
                        this.productosService.eliminarImagen(
                            this.obtenerNombreImagen(urlNueva)
                        ).subscribe({
                            next: () => {
                                this.cambiandoImagen.set(false);
                                this.errorImagen.set(
                                    'No se pudo cambiar la imagen. Se conservó la anterior.'
                                );
                            },
                            error: (errorLimpieza) => {
                                console.error(
                                    'No se pudo eliminar la nueva imagen:',
                                    errorLimpieza
                                );

                                this.cambiandoImagen.set(false);
                                this.errorImagen.set(
                                    'No se pudo cambiar la imagen ni eliminar el archivo nuevo.'
                                );
                            }
                        });
                    }
                });
            },
            error: (error) => {
                console.error('Error al subir la nueva imagen:', error);

                this.cambiandoImagen.set(false);
                this.errorImagen.set(
                    'No se pudo subir la imagen. La imagen actual no se modificó.'
                );
            }
        });
    }

    private obtenerNombreImagen(urlImagen: string): string {
        const rutaSinParametros = urlImagen.split('?')[0];

        return rutaSinParametros.substring(
            rutaSinParametros.lastIndexOf('/') + 1
        );
    }

    private finalizarCambioImagen(advertencia = ''): void {
        this.cambiandoImagen.set(false);
        this.archivoNuevaImagen.set(null);
        this.vistaPreviaNuevaImagen.set(null);

        this.mensajeImagen.set(
            advertencia || 'Imagen actualizada correctamente.'
        );

        this.modalImagenAbierto.set(false);
    }

}