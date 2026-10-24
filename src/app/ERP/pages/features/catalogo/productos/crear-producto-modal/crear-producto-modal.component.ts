
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
import { ResponseProducto } from '../../../../../interfaces/response-producto.interface';
import { ProductosService } from '../../../../../services/productos.service';
import {
    CrearProductoRequest,
    ResponseAtributo,
    ResponseMarca,
    ResponseSubcategoria
} from '../../../../../interfaces/crear-producto.interface';

@Component({
    selector: 'app-crear-producto-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './crear-producto-modal.component.html',
    styleUrl: './crear-producto-modal.component.css'
})
export class CrearProductoModalComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly productosService = inject(ProductosService);

    @Output() cerrar = new EventEmitter<void>();
    @Output() productoCreado = new EventEmitter<void>();
    @Input() producto: ResponseProducto | null = null;

    readonly marcas = signal<ResponseMarca[]>([]);
    readonly subcategorias = signal<ResponseSubcategoria[]>([]);
    readonly atributos = signal<ResponseAtributo[]>([]);
    readonly atributosSeleccionados = signal<string[]>([]);

    readonly cargandoOpciones = signal(true);
    readonly creandoProducto = signal(false);
    readonly errorCarga = signal('');
    readonly errorFormulario = signal('');
    readonly mensajeValidacion = signal('');

    readonly imagenPrevisualizacion = signal<string | null>(null);

    readonly archivoImagen = signal<File | null>(null);

    readonly modalImagenAbierto = signal(false);
    readonly archivoNuevaImagen = signal<File | null>(null);
    readonly vistaPreviaNuevaImagen = signal<string | null>(null);
    readonly cambiandoImagen = signal(false);
    readonly errorImagen = signal('');
    readonly mensajeImagen = signal('');

    readonly baseUrl = 'http://localhost:8080';

    seleccionarImagen(event: Event): void {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];

        if (!archivo) {
            return;
        }

        if (!archivo.type.startsWith('image/')) {
            this.errorFormulario.set('Selecciona un archivo de imagen válido.');
            input.value = '';
            return;
        }

        this.archivoImagen.set(archivo);
        this.errorFormulario.set('');

        const lector = new FileReader();

        lector.onload = () => {
            this.imagenPrevisualizacion.set(lector.result as string);
        };

        lector.readAsDataURL(archivo);
    }

    readonly formulario = this.fb.nonNullable.group({
        nombreProducto: [
            '',
            [
                Validators.required,
                Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
            ]
        ],
        descripcion: ['', [Validators.required]],
        precio: [100, [Validators.required, Validators.min(0.01)]],
        idMarca: ['', [Validators.required]],
        idSubCategoria: ['', [Validators.required]]
    });

    ngOnInit(): void {
        this.cargarOpciones();
    }

    cargarOpciones(): void {
        this.cargandoOpciones.set(true);
        this.errorCarga.set('');

        forkJoin({
            marcas: this.productosService.listarMarcas(),
            subcategorias: this.productosService.listarSubcategorias(),
            atributos: this.productosService.listarAtributos()
        }).subscribe({
            next: (respuesta) => {
                this.marcas.set(respuesta.marcas);
                this.subcategorias.set(respuesta.subcategorias);
                this.atributos.set(respuesta.atributos);

                if (!this.producto) {
                    this.cargandoOpciones.set(false);
                    return;
                }

                this.formulario.patchValue({
                    nombreProducto: this.producto.nombreProducto,
                    descripcion: this.producto.descripcion,
                    precio: this.producto.precio,
                    idMarca: this.producto.idMarca,
                    idSubCategoria: this.producto.idSubCategoria
                });

                this.productosService
                    .listarAtributosProducto(this.producto.idProducto)
                    .subscribe({
                        next: (atributosProducto) => {
                            this.atributosSeleccionados.set(
                                atributosProducto.map((atributo) => atributo.idAtributo)
                            );

                            this.cargandoOpciones.set(false);
                        },
                        error: (error) => {
                            console.error('Error al cargar atributos del producto:', error);
                            this.errorCarga.set(
                                'No fue posible cargar los atributos del producto.'
                            );
                            this.cargandoOpciones.set(false);
                        }
                    });
            },
            error: (error) => {
                console.error('Error al cargar opciones:', error);
                this.errorCarga.set(
                    'No fue posible cargar marcas, subcategorías o atributos.'
                );
                this.cargandoOpciones.set(false);
            }
        });
    }

    alternarAtributo(idAtributo: string, seleccionado: boolean): void {
        this.atributosSeleccionados.update((actuales) => {
            if (seleccionado) {
                return actuales.includes(idAtributo)
                    ? actuales
                    : [...actuales, idAtributo];
            }

            return actuales.filter((id) => id !== idAtributo);
        });
    }

    atributoSeleccionado(idAtributo: string): boolean {
        return this.atributosSeleccionados().includes(idAtributo);
    }

    quitarAtributo(idAtributo: string): void {
        this.atributosSeleccionados.update((actuales) =>
            actuales.filter((id) => id !== idAtributo)
        );
    }

    nombreAtributo(idAtributo: string): string {
        return this.atributos().find(
            (atributo) => atributo.idAtributo === idAtributo
        )?.nombreAtributo ?? '';
    }


    enviarFormulario(): void {
        if (this.creandoProducto()) {
            return;
        }

        this.errorFormulario.set('');
        this.mensajeValidacion.set('');

        const nombre = this.formulario.controls.nombreProducto.value.trim();
        const descripcion = this.formulario.controls.descripcion.value.trim();

        this.formulario.controls.nombreProducto.setValue(nombre);
        this.formulario.controls.descripcion.setValue(descripcion);
        this.formulario.markAllAsTouched();

        if (this.formulario.invalid) {
            this.errorFormulario.set(
                'Revisa los campos. El nombre solo puede contener letras y espacios simples; el precio debe ser mayor que cero.'
            );
            return;
        }

        const { idMarca, idSubCategoria, precio } =
            this.formulario.getRawValue();

        if (!idMarca) {
            this.errorFormulario.set('Selecciona una marca.');
            return;
        }

        if (!idSubCategoria) {
            this.errorFormulario.set('Selecciona una subcategoría.');
            return;
        }

        const idAtributos = this.atributosSeleccionados();

        if (idAtributos.length === 0) {
            this.errorFormulario.set('Selecciona al menos un atributo.');
            return;
        }

        if (!this.producto && !this.archivoImagen()) {
            this.errorFormulario.set('Selecciona una imagen para el producto.');
            return;
        }

        const crearRequest = (urlImagen: string): CrearProductoRequest => ({
            nombreProducto: nombre,
            descripcion,
            precio,
            urlImagen,
            idAtributos
        });

        this.creandoProducto.set(true);

        if (this.producto) {
            const request = crearRequest(this.producto.urlImagen);

            this.productosService.actualizarProducto(
                this.producto.idProducto,
                idMarca,
                idSubCategoria,
                request
            ).subscribe({
                next: () => {
                    this.creandoProducto.set(false);
                    this.productoCreado.emit();
                    this.cerrar.emit();
                },
                error: (error) => {
                    console.error('Error al actualizar producto:', error);
                    this.errorFormulario.set(
                        'No fue posible actualizar el producto. Revisa los datos e inténtalo nuevamente.'
                    );
                    this.creandoProducto.set(false);
                }
            });

            return;
        }

        this.productosService.subirImagen(this.archivoImagen()!).subscribe({
            next: (respuestaImagen) => {
                const urlImagen = respuestaImagen.urlImagen;
                const request = crearRequest(urlImagen);

                this.productosService.crearProducto(
                    idMarca,
                    idSubCategoria,
                    request
                ).subscribe({
                    next: () => {
                        this.creandoProducto.set(false);
                        this.productoCreado.emit();

                        this.formulario.reset({
                            nombreProducto: '',
                            descripcion: '',
                            precio: 100,
                            idMarca: '',
                            idSubCategoria: ''
                        });

                        this.atributosSeleccionados.set([]);
                        this.archivoImagen.set(null);
                        this.imagenPrevisualizacion.set(null);
                        this.errorFormulario.set('');
                        this.formulario.markAsPristine();
                        this.formulario.markAsUntouched();

                        this.mensajeValidacion.set(
                            'Producto creado correctamente. Puedes registrar otro producto.'
                        );
                    },
                    error: (errorCreacion) => {
                        console.error('Error al crear producto:', errorCreacion);

                        this.productosService.eliminarImagen(
                            this.obtenerNombreImagen(urlImagen)
                        ).subscribe({
                            next: () => {
                                this.mostrarErrorCreacion(errorCreacion);
                            },
                            error: (errorEliminacion) => {
                                console.error(
                                    'No se pudo eliminar la imagen huérfana:',
                                    errorEliminacion
                                );

                                this.mostrarErrorCreacion(
                                    errorCreacion,
                                    ' El producto no se creó y tampoco se pudo limpiar la imagen subida.'
                                );
                            }
                        });
                    }
                });
            },
            error: (errorSubida) => {
                console.error('Error al subir imagen:', errorSubida);
                this.errorFormulario.set(
                    'No fue posible subir la imagen. El producto no se creó.'
                );
                this.creandoProducto.set(false);
            }
        });
    }

    private mostrarErrorCreacion(error: any, adicional = ''): void {
        const mensajeBackend =
            typeof error?.error === 'string'
                ? error.error
                : error?.error?.mensaje;

        this.errorFormulario.set(
            (typeof mensajeBackend === 'string'
                ? mensajeBackend
                : 'No fue posible crear el producto. Revisa los datos e inténtalo nuevamente.')
            + adicional
        );

        this.creandoProducto.set(false);
    }

    cerrarModal(): void {
        if (this.creandoProducto()) {
            return;
        }

        this.cerrar.emit();
    }

    abrirModalImagen(): void {
        if (!this.producto) return;

        this.archivoNuevaImagen.set(null);
        this.vistaPreviaNuevaImagen.set(null);
        this.errorImagen.set('');
        this.mensajeImagen.set('');
        this.modalImagenAbierto.set(true);
    }

    cerrarModalImagen(): void {
        if (this.cambiandoImagen()) return;

        this.modalImagenAbierto.set(false);
        this.archivoNuevaImagen.set(null);
        this.vistaPreviaNuevaImagen.set(null);
        this.errorImagen.set('');
    }

    seleccionarNuevaImagen(event: Event): void {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];

        if (!archivo) return;

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
            this.errorImagen.set('No fue posible previsualizar la imagen.');
            this.archivoNuevaImagen.set(null);
            this.vistaPreviaNuevaImagen.set(null);
        };

        lector.readAsDataURL(archivo);
    }

    guardarNuevaImagen(): void {
        const producto = this.producto;
        const archivo = this.archivoNuevaImagen();

        if (!producto || !archivo || this.cambiandoImagen()) {
            if (!archivo) {
                this.errorImagen.set('Selecciona una imagen antes de continuar.');
            }
            return;
        }

        this.cambiandoImagen.set(true);
        this.errorImagen.set('');
        this.mensajeImagen.set('');

        const urlAnterior = producto.urlImagen;

        this.productosService.subirImagen(archivo).subscribe({
            next: (respuesta) => {
                const urlNueva = respuesta.urlImagen;

                this.productosService.actualizarUrlImagen(
                    producto.idProducto,
                    urlNueva
                ).subscribe({
                    next: () => {
                        // El PATCH confirmó que el producto ya tiene la nueva URL.
                        this.producto = {
                            ...producto,
                            urlImagen: urlNueva
                        };

                        this.productoCreado.emit();

                        const nombreImagenAnterior =
                            this.obtenerNombreImagen(urlAnterior);

                        this.productosService
                            .eliminarImagen(nombreImagenAnterior)
                            .subscribe({
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
                    },
                    error: (error) => {
                        console.error('Error al actualizar la URL:', error);

                        // El PATCH falló: intentamos limpiar la imagen recién subida.
                        this.productosService
                            .eliminarImagen(this.obtenerNombreImagen(urlNueva))
                            .subscribe({
                                next: () => {
                                    this.cambiandoImagen.set(false);
                                    this.errorImagen.set(
                                        'No se pudo asignar la nueva imagen. Se conservó la anterior.'
                                    );
                                },
                                error: (errorLimpieza) => {
                                    console.error(
                                        'No se pudo eliminar la nueva imagen:',
                                        errorLimpieza
                                    );

                                    this.cambiandoImagen.set(false);
                                    this.errorImagen.set(
                                        'No se pudo actualizar la imagen y tampoco se pudo eliminar el archivo nuevo.'
                                    );
                                }
                            });
                    }
                });
            },
            error: (error) => {
                console.error('Error al subir la imagen:', error);
                this.cambiandoImagen.set(false);
                this.errorImagen.set(
                    'No se pudo subir la nueva imagen. La imagen actual no se modificó.'
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