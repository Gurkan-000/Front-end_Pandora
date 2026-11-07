
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { DetalleProductoComponent } from './detalle-producto.component';
import { ProductApiService } from '../../../core/services/product-api.service';

import {
    Product,
    ProductVariantResponse
} from '../catalogo/product.interface';


describe('DetalleProductoComponent', () => {

    let fixture: ComponentFixture<DetalleProductoComponent>;

    const producto: Product = {

        idProducto: 'producto-1',

        nombreProducto: 'Polo de vestir Adidas',

        descripcion: 'Polo para usar en el día a día',

        nombreMarca: 'Adidas',

        nombreCategoria: 'Ropa',

        nombreSubcategoria: 'Polos',

        precio: 80,

        urlImagen: 'http://localhost:8080/api/imagen/producto.webp',

        cantidadVariantes: 3

    };


    const variantes: ProductVariantResponse[] = [

        {
            idVarianteProducto: 'variante-principal',

            stock: 5,

            urlImagen: null,

            esPrincipal: true,

            atributos: [

                {
                    idValorAtributo: 'talla-l',
                    idAtributo: 'talla',
                    valor: 'L',
                    nombreAtributo: 'Talla'
                },

                {
                    idValorAtributo: 'color-rojo',
                    idAtributo: 'color',
                    valor: 'Rojo',
                    nombreAtributo: 'Color'
                }

            ]

        },

        {
            idVarianteProducto: 'variante-l-verde',

            stock: 2,

            urlImagen: 'http://localhost:8080/api/imagen/verde.webp',

            esPrincipal: false,

            atributos: [

                {
                    idValorAtributo: 'talla-l',
                    idAtributo: 'talla',
                    valor: 'L',
                    nombreAtributo: 'Talla'
                },

                {
                    idValorAtributo: 'color-verde',
                    idAtributo: 'color',
                    valor: 'Verde',
                    nombreAtributo: 'Color'
                }

            ]

        },

        {
            idVarianteProducto: 'variante-x-rojo',

            stock: 0,

            urlImagen: 'http://localhost:8080/api/imagen/x-rojo.webp',

            esPrincipal: false,

            atributos: [

                {
                    idValorAtributo: 'talla-x',
                    idAtributo: 'talla',
                    valor: 'X',
                    nombreAtributo: 'Talla'
                },

                {
                    idValorAtributo: 'color-rojo',
                    idAtributo: 'color',
                    valor: 'Rojo',
                    nombreAtributo: 'Color'
                }

            ]

        }

    ];


    const productApiMock = {

        getProductById: vi.fn(),

        getProductVariants: vi.fn()

    };


    beforeEach(async () => {

        productApiMock.getProductById.mockReturnValue(
            of(product)
        );

        productApiMock.getProductVariants.mockReturnValue(
            of(variantes)
        );


        await TestBed.configureTestingModule({

            imports: [
                DetalleProductoComponent
            ],

            providers: [

                provideRouter([]),

                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(
                            convertToParamMap({
                                idProducto: 'producto-1'
                            })
                        )
                    }
                },

                {
                    provide: ProductApiService,
                    useValue: productApiMock
                }

            ]

        }).compileComponents();


        fixture = TestBed.createComponent(
            DetalleProductoComponent
        );

        fixture.detectChanges();

        await fixture.whenStable();

        fixture.detectChanges();

    });


    it('debe cargar el producto y seleccionar la variante principal', () => {

        expect(
            fixture.nativeElement.textContent
        ).toContain('Polo de vestir Adidas');

        expect(
            fixture.nativeElement.textContent
        ).toContain('En stock: 5');

        const imagen = fixture.nativeElement.querySelector(
            '.product-detail-image'
        ) as HTMLImageElement;

        expect(imagen.src).toContain('producto.webp');

    });


    it('debe cambiar de variante cuando se seleccionan otros atributos', () => {

        const opciones = Array.from(

            fixture.nativeElement.querySelectorAll(
                '.attribute-option'
            )

        ) as HTMLButtonElement[];


        const tallaX = opciones.find(opcion =>

            opcion.textContent?.trim() === 'X'

        );


        expect(tallaX).toBeDefined();

        tallaX!.click();

        fixture.detectChanges();


        expect(
            fixture.nativeElement.textContent
        ).toContain('Agotado');


        const imagen = fixture.nativeElement.querySelector(
            '.product-detail-image'
        ) as HTMLImageElement;

        expect(imagen.src).toContain('x-rojo.webp');

    });


    it('debe mostrar combinación no disponible si no existe la variante', () => {

        const opciones = Array.from(

            fixture.nativeElement.querySelectorAll(
                '.attribute-option'
            )

        ) as HTMLButtonElement[];


        const tallaX = opciones.find(opcion =>

            opcion.textContent?.trim() === 'X'

        );

        tallaX!.click();

        fixture.detectChanges();


        const colorVerde = Array.from(

            fixture.nativeElement.querySelectorAll(
                '.attribute-option'
            )

        ).find(opcion =>

            opcion.textContent?.trim() === 'Verde'

        ) as HTMLButtonElement;


        colorVerde.click();

        fixture.detectChanges();


        expect(
            fixture.nativeElement.textContent
        ).toContain('Combinación no disponible');


        const imagen = fixture.nativeElement.querySelector(
            '.product-detail-image'
        ) as HTMLImageElement;

        expect(imagen.src).toContain('producto.webp');

    });

});
