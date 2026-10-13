
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ProductosService } from '../../../../services/productos.service';
import { ResponseProducto } from '../../../../interfaces/response-producto.interface';
import { CrearProductoModalComponent } from './crear-producto-modal/crear-producto-modal.component';
import { ConfirmationDialogComponent } from '../../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-productos-erp',
    standalone: true,
    imports: [CrearProductoModalComponent, ConfirmationDialogComponent],
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

    verVariantes(producto: ResponseProducto): void {
        console.log('Producto seleccionado:', producto.idProducto);
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
        this.productosService
            .eliminarProducto(producto.idProducto)
            .pipe(finalize(() => this.eliminandoProducto.set(false)))
            .subscribe({
                next: () => {
                    this.productos.update((productosActuales) =>
                        productosActuales.filter(
                            (actual) => actual.idProducto !== producto.idProducto
                        )
                    );
                    this.productoPorEliminar.set(null);
                },
                error: (error) => {
                    console.error('Error al eliminar producto:', error);

                    const mensajeBackend = error?.error?.mensaje;

                    this.error.set(
                        typeof mensajeBackend === 'string'
                            ? mensajeBackend
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

}