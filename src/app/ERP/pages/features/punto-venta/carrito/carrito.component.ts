import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { CarritoERPService } from '../../../../services/carrito-erp.service';
import { ResponseCarritoERP } from '../../../../interfaces/response-carrito-erp.interface';
import { DetallesCarritoModalComponent } from './detalles-carrito-modal/detalles-carrito-modal.component';

@Component({
    selector: 'app-carrito-erp',
    standalone: true,
    imports: [
        CurrencyPipe,
        DetallesCarritoModalComponent
    ],
    templateUrl: './carrito.component.html',
    styleUrl: './carrito.component.css'
})
export class CarritoERPComponent implements OnInit {

    private readonly carritoService = inject(CarritoERPService);

    readonly carritos = signal<ResponseCarritoERP[]>([]);
    readonly cargando = signal(false);
    readonly error = signal('');

    readonly carritoSeleccionado = signal<ResponseCarritoERP | null>(null);

    ngOnInit(): void {
        this.cargarCarritos();
    }

    cargarCarritos(): void {
        this.cargando.set(true);
        this.error.set('');

        this.carritoService.listarCarritos().pipe(
            finalize(() => this.cargando.set(false))
        ).subscribe({
            next: respuesta => {
                this.carritos.set(respuesta);
            },
            error: error => {
                console.error('Error al cargar los carritos:', error);

                this.error.set(
                    'No fue posible cargar los carritos. Inténtalo nuevamente.'
                );
            }
        });
    }

    verDetalles(carrito: ResponseCarritoERP): void {
        this.carritoSeleccionado.set(carrito);
    }

    cerrarDetalles(): void {
        this.carritoSeleccionado.set(null);
    }

    actualizarListadoCarritos(): void {
        this.cargarCarritos();
    }

}