
import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    inject,
    signal
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { CarritoERPService } from '../../../../../services/carrito-erp.service';
import { ResponseCarritoERP } from '../../../../../interfaces/response-carrito-erp.interface';
import { ResponseDetalleCarritoERP } from '../../../../../interfaces/response-detalle-carrito-erp.interface';
import { ConfirmationDialogComponent } from '../../../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-detalles-carrito-modal',
    standalone: true,
    imports: [
        CurrencyPipe,
        ConfirmationDialogComponent
    ],
    templateUrl: './detalles-carrito-modal.component.html',
    styleUrl: './detalles-carrito-modal.component.css'
})
export class DetallesCarritoModalComponent implements OnInit {

    @Input({ required: true }) carrito!: ResponseCarritoERP;

    @Output() cerrar = new EventEmitter<void>();
    @Output() carritoVaciado = new EventEmitter<void>();

    private readonly carritoService = inject(CarritoERPService);

    readonly detalles = signal<ResponseDetalleCarritoERP[]>([]);
    readonly cargando = signal(false);
    readonly vaciando = signal(false);
    readonly error = signal('');

    readonly mostrarConfirmacion = signal(false);

    ngOnInit(): void {
        this.cargarDetalles();
    }

    cargarDetalles(): void {
        this.cargando.set(true);
        this.error.set('');

        this.carritoService.listarDetallesCarrito(this.carrito.idCarrito)
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: respuesta => {
                    this.detalles.set(respuesta);
                },
                error: error => {
                    console.error('Error al cargar los detalles del carrito:', error);
                    this.error.set(
                        'No fue posible cargar los detalles del carrito.'
                    );
                }
            });
    }

    abrirConfirmacion(): void {
        if (this.detalles().length === 0 || this.vaciando()) {
            return;
        }

        this.mostrarConfirmacion.set(true);
    }

    cancelarVaciado(): void {
        this.mostrarConfirmacion.set(false);
    }

    confirmarVaciado(): void {
        if (this.vaciando()) {
            return;
        }

        this.vaciando.set(true);

        this.carritoService.vaciarCarrito(this.carrito.idCarrito)
            .pipe(
                finalize(() => this.vaciando.set(false))
            )
            .subscribe({
                next: () => {
                    this.detalles.set([]);
                    this.mostrarConfirmacion.set(false);
                    this.carritoVaciado.emit();
                },
                error: error => {
                    console.error('Error al vaciar el carrito:', error);
                    this.error.set(
                        'No fue posible vaciar el carrito. Inténtalo nuevamente.'
                    );
                    this.mostrarConfirmacion.set(false);
                }
            });
    }

    cerrarModal(): void {
        if (this.vaciando()) {
            return;
        }

        this.cerrar.emit();
    }
}
