import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ResponseProducto } from '../../../../interfaces/response-producto.interface';
import { ProductosService } from '../../../../services/productos.service';
import { ProductosERPComponent } from './productos.component';

describe('ProductosERPComponent deletion confirmation', () => {
    let fixture: ComponentFixture<ProductosERPComponent>;
    let productosService: Pick<ProductosService, 'listarProductos' | 'eliminarProducto'>;
    const producto = {
        idProducto: 'product-1',
        nombreProducto: 'Reloj Meridian',
        nombreMarca: 'Meridian',
        nombreSubcategoria: 'Relojes',
        cantidadVariantes: 1
    } as ResponseProducto;

    beforeEach(async () => {
        productosService = {
            listarProductos: vi.fn(() => of([producto])),
            eliminarProducto: vi.fn(() => of('Eliminado'))
        };

        await TestBed.configureTestingModule({
            imports: [ProductosERPComponent],
            providers: [{ provide: ProductosService, useValue: productosService }]
        }).compileComponents();

        fixture = TestBed.createComponent(ProductosERPComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('abre el modal al solicitar eliminar y no llama API al cancelar', () => {
        fixture.nativeElement.querySelector('[aria-label="Eliminar Reloj Meridian"]').click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('app-confirmation-dialog')).not.toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Se eliminará “Reloj Meridian”');

        fixture.nativeElement.querySelector('.secondary-button').click();
        fixture.detectChanges();
        expect(productosService.eliminarProducto).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('app-confirmation-dialog')).toBeNull();
    });

    it('elimina el producto al confirmar en el modal', async () => {
        fixture.nativeElement.querySelector('[aria-label="Eliminar Reloj Meridian"]').click();
        fixture.detectChanges();
        fixture.nativeElement.querySelector('app-confirmation-dialog .danger-button').click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(productosService.eliminarProducto).toHaveBeenCalledWith('product-1');
        expect(fixture.componentInstance.productos()).toEqual([]);
        expect(fixture.nativeElement.querySelector('app-confirmation-dialog')).toBeNull();
    });
});