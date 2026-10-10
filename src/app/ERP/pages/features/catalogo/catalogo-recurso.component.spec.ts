import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { CatalogoRecursoERPComponent } from './catalogo-recurso.component';
import { CatalogRecord, CatalogResource } from './catalogo-resource-api.service';
import { CatalogoResourceApiService } from './catalogo-resource-api.service';

describe('CatalogoRecursoERPComponent', () => {
    let fixture: ComponentFixture<CatalogoRecursoERPComponent>;
    let routeData: BehaviorSubject<Record<string, unknown>>;
    let api: Pick<CatalogoResourceApiService, 'listar' | 'crear'>;

    const recordsByResource: Partial<Record<CatalogResource, CatalogRecord[]>> = {
        categoria: [{ idCategoria: 'cat-1', nombreCategoria: 'Vestimentas' }],
        atributo: [{ idAtributo: 'attr-1', nombreAtributo: 'Color' }],
        subcategoria: [{ idSubcategoria: 'sub-1', idCategoria: 'cat-1', nombreSubcategoria: 'Vestidos' }],
        valorAtributo: [{ idValorAtributo: 'value-1', idAtributo: 'attr-1', valor: 'Rojo' }],
        marca: [{ idMarca: 'brand-1', nombreMarca: 'Rumbo' }]
    };

    beforeEach(async () => {
        routeData = new BehaviorSubject<Record<string, unknown>>({ resource: 'subcategoria' });
        api = {
            listar: vi.fn((resource: CatalogResource) => of(recordsByResource[resource] ?? [])),
            crear: vi.fn((resource, payload) => of({
                [resource === 'subcategoria' ? 'idSubcategoria' : 'idValorAtributo']: 'new-id',
                ...payload
            }))
        };

        await TestBed.configureTestingModule({
            imports: [CatalogoRecursoERPComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { data: routeData.asObservable() } },
                { provide: CatalogoResourceApiService, useValue: api }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CatalogoRecursoERPComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('carga las categorías en el selector de Subcategorías sin interacción adicional', () => {
        const select = fixture.nativeElement.querySelector('#parentId') as HTMLSelectElement;
        expect(api.listar).toHaveBeenCalledWith('subcategoria');
        expect(api.listar).toHaveBeenCalledWith('categoria');
        expect(select.options.length).toBe(2);
        expect(select.options[1].textContent?.trim()).toBe('Vestimentas');
        expect(fixture.nativeElement.textContent).toContain('Vestidos');
    });

    it('recarga la lista padre al cambiar de submódulo con el componente reutilizado', async () => {
        routeData.next({ resource: 'valorAtributo' });
        await fixture.whenStable();
        fixture.detectChanges();

        const select = fixture.nativeElement.querySelector('#parentId') as HTMLSelectElement;
        expect(api.listar).toHaveBeenCalledWith('valorAtributo');
        expect(api.listar).toHaveBeenCalledWith('atributo');
        expect(select.options[1].textContent?.trim()).toBe('Color');
        expect(fixture.nativeElement.textContent).toContain('Rojo');
    });

    it('no muestra un selector padre en módulos que no tienen relación padre', async () => {
        routeData.next({ resource: 'marca' });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('#parentId')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Rumbo');
    });

    it('envía el id de categoría separado del body al crear una subcategoría', () => {
        const parentSelect = fixture.nativeElement.querySelector('#parentId') as HTMLSelectElement;
        parentSelect.value = 'cat-1';
        parentSelect.dispatchEvent(new Event('change'));

        const nameInput = fixture.nativeElement.querySelector('#recordName') as HTMLInputElement;
        nameInput.value = 'Pantalones';
        nameInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));

        expect(api.crear).toHaveBeenCalledWith(
            'subcategoria',
            { nombreSubCategoria: 'Pantalones' },
            'cat-1'
        );
    });

    it('recarga el listado cuando el POST no devuelve un id', async () => {
        api.crear = vi.fn(() => of({}));
        routeData.next({ resource: 'marca' });
        await fixture.whenStable();
        fixture.detectChanges();

        const nameInput = fixture.nativeElement.querySelector('#recordName') as HTMLInputElement;
        nameInput.value = 'Nueva marca';
        nameInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
        await fixture.whenStable();
        fixture.detectChanges();

        expect(api.listar).toHaveBeenCalledTimes(4);
        expect(fixture.nativeElement.textContent).toContain('Rumbo');
    });
});