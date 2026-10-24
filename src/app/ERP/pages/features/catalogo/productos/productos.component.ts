
import { Component, inject, OnInit, signal } from '@angular/core';
import {
    catchError,
    finalize,
    map,
    of,
    switchMap
} from 'rxjs';

import { ProductosService } from '../../../../services/productos.service';
import { ResponseProducto } from '../../../../interfaces/response-producto.interface';
import { CrearProductoModalComponent } from './crear-producto-modal/crear-producto-modal.component';
import { ConfirmationDialogComponent } from '../../../../shared/confirmation-dialog/confirmation-dialog.component';
import { ResponseAtributo } from '../../../../interfaces/crear-producto.interface';
import {
    ResponseVarianteProducto
} from '../../../../interfaces/response-variante-producto.interface';
import { CrearVarianteProductoModalComponent } from './crear-varianteproducto-modal/crear-varianteproducto-modal.component';
import { ModalVariantePrincipalComponent } from './modal-variante-principal/modal-variante-principal.component';

@Component({
    selector: 'app-productos-erp',
    standalone: true,
    imports: [
        CrearProductoModalComponent,
        CrearVarianteProductoModalComponent,
        ConfirmationDialogComponent,
        ModalVariantePrincipalComponent
    ],
    templateUrl: './productos.component.html',
    styleUrl: './productos.component.css'
})
export class ProductosERPComponent implements OnInit {
    private readonly productosService = inject(ProductosService);

    readonly productos = signal<ResponseProducto[]>([]);
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly mostrarModalCrear = signal(false);

    readonly productoSeleccionado = signal<ResponseProducto | null>(null);
    readonly productoPorEliminar = signal<ResponseProducto | null>(null);
    readonly eliminandoProducto = signal(false);

    readonly mostrarModalVariantes = signal(false);
    readonly variantes = signal<ResponseVarianteProducto[]>([]);
    readonly atributosVariantes = signal<ResponseAtributo[]>([]);
    readonly cargandoVariantes = signal(false);
    readonly errorVariantes = signal('');

    readonly mostrarModalCrearVariante = signal(false);

    readonly varianteSeleccionada = signal<ResponseVarianteProducto | null>(null);
    readonly variantePorEliminar = signal<ResponseVarianteProducto | null>(null);
    readonly eliminandoVariante = signal(false);

    readonly mostrarAvisoVariantePrincipal = signal(false);

    ngOnInit(): void {
        this.cargarProductos();
    }

    cargarProductos(): void {
        this.cargando.set(true);
        this.error.set('');

        this.productosService.listarProductos()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: (respuesta) => {
                    this.productos.set(respuesta);
                },
                error: (error) => {
                    console.error('Error al cargar productos:', error);
                    this.error.set(
                        'No fue posible cargar los productos. Inténtalo nuevamente.'
                    );
                }
            });
    }

    abrirModalCrear(): void {
        this.productoSeleccionado.set(null);
        this.mostrarModalCrear.set(true);
    }


    cerrarModalCrear(): void {
        this.mostrarModalCrear.set(false);
        this.productoSeleccionado.set(null);
    }


    editarProducto(producto: ResponseProducto): void {
        this.error.set('');
        this.productoSeleccionado.set(producto);
        this.mostrarModalCrear.set(true);
    }

    eliminarProducto(producto: ResponseProducto): void {
        this.productoPorEliminar.set(producto);
        this.error.set('');
    }

    confirmarEliminacionProducto(): void {
        const producto = this.productoPorEliminar();

        if (!producto || this.eliminandoProducto()) {
            return;
        }

        this.eliminandoProducto.set(true);
        this.error.set('');

        this.productosService
            .eliminarProducto(producto.idProducto)
            .pipe(
                switchMap(() => {

                    this.productos.update((productosActuales) =>
                        productosActuales.filter(
                            (actual) =>
                                actual.idProducto !== producto.idProducto
                        )
                    );

                    this.productoPorEliminar.set(null);

                    const nombreImagen = producto.urlImagen
                        ?.split('/')
                        .pop();

                    if (!nombreImagen) {
                        return of(true);
                    }

                    return this.productosService
                        .eliminarImagen(nombreImagen)
                        .pipe(
                            map(() => true),
                            catchError((error) => {
                                if (error.status === 404) {
                                    return of(true);
                                }

                                console.error(
                                    'El producto se eliminó, pero no se pudo eliminar su imagen:',
                                    error
                                );

                                return of(false);
                            })
                        );
                }),
                finalize(() => this.eliminandoProducto.set(false))
            )
            .subscribe({
                next: (imagenEliminada) => {
                    if (!imagenEliminada) {
                        this.error.set(
                            'El producto se eliminó correctamente, pero no se pudo eliminar su imagen. Revisa el servidor.'
                        );
                    }
                },
                error: (error) => {
                    console.error('Error al eliminar producto:', error);

                    const mensajeBackend = error?.error?.mensaje;

                    this.error.set(
                        typeof mensajeBackend === 'string'
                            ? mensajeBackend
                            : error.status === 404
                                ? 'El producto no existe o ya fue eliminado.'
                                : 'No fue posible eliminar el producto. Inténtalo nuevamente.'
                    );
                }
            });
    }

    cancelarEliminacionProducto(): void {
        if (!this.eliminandoProducto()) {
            this.productoPorEliminar.set(null);
        }
    }

    verVariantes(producto: ResponseProducto): void {
        this.productoSeleccionado.set(producto);
        this.mostrarModalVariantes.set(true);
        this.cargarVariantes(producto.idProducto);
    }

    cargarVariantes(idProducto: string): void {
        this.cargandoVariantes.set(true);
        this.errorVariantes.set('');
        this.variantes.set([]);
        this.atributosVariantes.set([]);

        let variantesCargadas = false;
        let atributosCargados = false;

        const comprobarCargaCompleta = (): void => {
            if (variantesCargadas && atributosCargados) {
                this.cargandoVariantes.set(false);
            }
        };

        this.productosService.listarVariantesProducto(idProducto).subscribe({
            next: (respuesta) => {
                this.variantes.set(respuesta);
                variantesCargadas = true;
                comprobarCargaCompleta();
            },
            error: (error) => {
                console.error('Error al cargar variantes:', error);
                this.errorVariantes.set(
                    'No fue posible cargar las variantes del producto.'
                );
                this.cargandoVariantes.set(false);
            }
        });

        this.productosService.listarAtributosProducto(idProducto).subscribe({
            next: (respuesta) => {
                this.atributosVariantes.set(respuesta);
                atributosCargados = true;
                comprobarCargaCompleta();
            },
            error: (error) => {
                console.error('Error al cargar atributos del producto:', error);
                this.errorVariantes.set(
                    'No fue posible cargar los atributos del producto.'
                );
                this.cargandoVariantes.set(false);
            }
        });
    }

    abrirModalCrearVariante(): void {
        if (!this.productoSeleccionado()) {
            return;
        }

        this.varianteSeleccionada.set(null);
        this.mostrarModalCrearVariante.set(true);
    }

    editarVariante(variante: ResponseVarianteProducto): void {
        this.errorVariantes.set('');
        this.varianteSeleccionada.set(variante);
        this.mostrarModalCrearVariante.set(true);
    }

    cerrarModalCrearVariante(): void {
        this.mostrarModalCrearVariante.set(false);
        this.varianteSeleccionada.set(null);
    }

    varianteCreada(): void {
        const producto = this.productoSeleccionado();

        if (!producto) {
            return;
        }

        this.cargarVariantes(producto.idProducto);

        this.mostrarModalVariantes.set(true);
        this.mostrarModalCrearVariante.set(true);
    }

    cerrarModalVariantes(): void {
        this.mostrarModalCrearVariante.set(false);
        this.mostrarModalVariantes.set(false);
        this.variantes.set([]);
        this.atributosVariantes.set([]);
        this.errorVariantes.set('');
    }

    obtenerValorAtributo(
        variante: ResponseVarianteProducto,
        idAtributo: string
    ): string {
        return variante.atributos.find(
            (atributo) => atributo.idAtributo === idAtributo
        )?.valor ?? '—';
    }

    solicitarEliminacionVariante(
        variante: ResponseVarianteProducto
    ): void {
        this.errorVariantes.set('');

        if (variante.esPrincipal) {
            this.variantePorEliminar.set(null);
            this.mostrarAvisoVariantePrincipal.set(true);
            return;
        }

        this.mostrarAvisoVariantePrincipal.set(false);
        this.variantePorEliminar.set(variante);
    }


    cancelarEliminacionVariante(): void {
        if (!this.eliminandoVariante()) {
            this.variantePorEliminar.set(null);
        }
    }

    cerrarAvisoVariantePrincipal(): void {
        this.mostrarAvisoVariantePrincipal.set(false);
    }

    confirmarEliminacionVariante(): void {
        const variante = this.variantePorEliminar();
        const producto = this.productoSeleccionado();

        if (!variante || !producto || this.eliminandoVariante()) {
            return;
        }

        this.eliminandoVariante.set(true);
        this.errorVariantes.set('');

        this.productosService
            .eliminarVarianteProducto(variante.idVarianteProducto)
            .pipe(
                finalize(() => this.eliminandoVariante.set(false))
            )
            .subscribe({
                next: () => {
                    // Cerrar el modal de confirmación inmediatamente.
                    this.variantePorEliminar.set(null);

                    // Actualizar la lista de variantes.
                    this.cargarVariantes(producto.idProducto);
                },
                error: (error) => {
                    console.error('Error al eliminar la variante:', error);

                    // Mantener el modal abierto para permitir reintentar.
                    this.errorVariantes.set(
                        'No fue posible eliminar la variante. Inténtalo nuevamente.'
                    );
                }
            });
    }


}