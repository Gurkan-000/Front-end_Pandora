
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

        const request: CrearProductoRequest = {
            nombreProducto: nombre,
            descripcion,
            precio,
            urlImagen: 'url',
            idAtributos
        };

        this.creandoProducto.set(true);

        const peticion = this.producto
            ? this.productosService.actualizarProducto(
                this.producto.idProducto,
                idMarca,
                idSubCategoria,
                request
            )
            : this.productosService.crearProducto(
                idMarca,
                idSubCategoria,
                request
            );

        peticion.subscribe({
            next: () => {
                this.creandoProducto.set(false);
                this.productoCreado.emit();

                if (this.producto) {
                    this.cerrar.emit();
                    return;
                }

                this.formulario.reset({
                    nombreProducto: '',
                    descripcion: '',
                    precio: 100,
                    idMarca: '',
                    idSubCategoria: ''
                });

                this.atributosSeleccionados.set([]);
                this.errorFormulario.set('');
                this.mensajeValidacion.set('');

                this.formulario.markAsPristine();
                this.formulario.markAsUntouched();

                this.mensajeValidacion.set(
                    'Producto creado correctamente. Puedes registrar otro producto.'
                );
            },
            error: (error) => {
                console.error(
                    this.producto
                        ? 'Error al actualizar producto:'
                        : 'Error al crear producto:',
                    error
                );

                const mensajeBackend =
                    typeof error?.error === 'string'
                        ? error.error
                        : error?.error?.mensaje;

                this.errorFormulario.set(
                    typeof mensajeBackend === 'string'
                        ? mensajeBackend
                        : this.producto
                            ? 'No fue posible actualizar el producto. Revisa los datos e inténtalo nuevamente.'
                            : 'No fue posible crear el producto. Revisa los datos e inténtalo nuevamente.'
                );

                this.creandoProducto.set(false);
            }
        });
    }

    cerrarModal(): void {
        if (this.creandoProducto()) {
            return;
        }

        this.cerrar.emit();
    }
}