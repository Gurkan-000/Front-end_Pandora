
import { CurrencyPipe } from '@angular/common';
import {
    Component,
    DestroyRef,
    computed,
    inject,
    signal
} from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
    EMPTY,
    catchError,
    distinctUntilChanged,
    filter,
    finalize,
    map,
    switchMap,
    throwError
} from 'rxjs';

import { ProductApiService } from '../../../core/services/product-api.service';

import {
    Product,
    ProductVariantAttributeResponse,
    ProductVariantResponse
} from '../catalogo/product.interface';


interface AtributoDisponible {

    idAtributo: string;

    nombreAtributo: string;

    valores: {

        idValorAtributo: string;

        valor: string;

    }[];

}


@Component({
    selector: 'app-detalle-producto',
    imports: [
        CurrencyPipe,
        RouterLink
    ],
    templateUrl: './detalle-producto.component.html',
    styleUrl: './detalle-producto.component.css'
})
export class DetalleProductoComponent {

    private readonly productApi = inject(ProductApiService);

    private readonly route = inject(ActivatedRoute);

    private readonly destroyRef = inject(DestroyRef);

    private readonly router = inject(Router);

    private readonly authService = inject(AuthService);

    protected readonly mensajeCarrito = signal('');

    // Información general del producto.
    readonly producto = signal<Product | null>(null);


    // Variantes pertenecientes al producto seleccionado.
    readonly variantes = signal<ProductVariantResponse[]>([]);


    // Valores actualmente seleccionados por el cliente.
    readonly valoresSeleccionados = signal<Record<string, string>>({});


    // Estados de la página.
    readonly cargando = signal(true);

    readonly errorCarga = signal('');


    readonly atributosDisponibles = computed(() => {

        const grupos = new Map<string, AtributoDisponible>();

        for (const variante of this.variantes()) {

            for (const atributo of variante.atributos) {

                let grupo = grupos.get(atributo.idAtributo);

                if (!grupo) {

                    grupo = {

                        idAtributo: atributo.idAtributo,

                        nombreAtributo: atributo.nombreAtributo,

                        valores: []

                    };

                    grupos.set(atributo.idAtributo, grupo);

                }

                const valorExiste = grupo.valores.some(valor =>

                    valor.idValorAtributo === atributo.idValorAtributo

                );

                if (!valorExiste) {

                    grupo.valores.push({

                        idValorAtributo: atributo.idValorAtributo,

                        valor: atributo.valor

                    });

                }

            }

        }

        return Array.from(grupos.values());

    });

    readonly varianteSeleccionada = computed(() => {

        const variantes = this.variantes();

        const atributos = this.atributosDisponibles();

        const seleccionados = this.valoresSeleccionados();


        if (variantes.length === 0) {

            return null;

        }


        // Productos cuyas variantes no tienen atributos.
        if (atributos.length === 0) {

            return variantes.find(variante =>

                variante.esPrincipal

            ) ?? null;

        }


        // Todavía falta seleccionar algún atributo.
        const faltaSeleccionar = atributos.some(atributo =>

            !seleccionados[atributo.idAtributo]

        );

        if (faltaSeleccionar) {

            return null;

        }


        return variantes.find(variante => {

            // Evita coincidencias parciales.
            if (variante.atributos.length !== atributos.length) {

                return false;

            }

            return variante.atributos.every(atributo =>

                seleccionados[atributo.idAtributo]
                === atributo.idValorAtributo

            );

        }) ?? null;

    });


    readonly imagenActual = computed(() => {

        const imagenVariante = this.varianteSeleccionada()?.urlImagen;

        const imagenProducto = this.producto()?.urlImagen;

        return imagenVariante || imagenProducto || null;

    });


    constructor() {

        this.route.paramMap.pipe(

            map(params => params.get('idProducto')),

            filter((id): id is string =>

                id !== null && id.length > 0

            ),

            distinctUntilChanged(),

            switchMap(idProducto => {

                this.cargando.set(true);

                this.errorCarga.set('');

                this.producto.set(null);

                this.variantes.set([]);

                this.valoresSeleccionados.set({});


                return this.productApi.getProductById(idProducto).pipe(

                    switchMap(producto => {

                        if (!producto) {

                            return throwError(() =>

                                new Error('PRODUCT_NOT_FOUND')

                            );

                        }

                        if (producto.cantidadVariantes <= 0) {

                            return throwError(() =>

                                new Error('PRODUCT_WITHOUT_VARIANTS')

                            );

                        }

                        return this.productApi
                            .getProductVariants(idProducto)
                            .pipe(

                                map(variantes => ({

                                    producto,

                                    variantes

                                }))

                            );

                    }),

                    catchError((error: unknown) => {

                        console.error(
                            'Error al cargar el detalle del producto:',
                            error
                        );

                        if (
                            error instanceof Error
                            && error.message === 'PRODUCT_NOT_FOUND'
                        ) {

                            this.errorCarga.set(
                                'No encontramos el producto solicitado.'
                            );

                        } else if (
                            error instanceof Error
                            && error.message === 'PRODUCT_WITHOUT_VARIANTS'
                        ) {

                            this.errorCarga.set(
                                'Este producto todavía no tiene variantes disponibles.'
                            );

                        } else {

                            this.errorCarga.set(
                                'No fue posible cargar el producto. Inténtalo nuevamente.'
                            );

                        }

                        return EMPTY;

                    }),

                    finalize(() => this.cargando.set(false))

                );

            }),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe(({ producto, variantes }) => {


            // El backend garantiza una variante principal.
            const variantePrincipal = variantes.find(variante =>

                variante.esPrincipal

            );


            if (!variantePrincipal) {

                this.errorCarga.set(
                    'No se encontró la variante principal del producto.'
                );

                return;

            }


            this.producto.set(producto);

            this.variantes.set(variantes);


            // Inicializamos la selección con los atributos
            // correspondientes a la variante principal.
            const seleccionPrincipal: Record<string, string> = {};


            for (const atributo of variantePrincipal.atributos) {

                seleccionPrincipal[atributo.idAtributo] =
                    atributo.idValorAtributo;

            }


            this.valoresSeleccionados.set(seleccionPrincipal);

        });

    }

    seleccionarValor(
        idAtributo: string,
        idValorAtributo: string
    ): void {

        this.valoresSeleccionados.update(actuales => ({

            ...actuales,

            [idAtributo]: idValorAtributo

        }));

    }

    protected intentarAgregarAlCarrito(): void {

        this.mensajeCarrito.set('');

        this.authService.validarSesion().subscribe(autenticado => {

            if (!autenticado) {

                void this.router.navigate(['/login']);

                return;
            }

            // El usuario está autenticado, pero todavía no
            // tenemos conectada la funcionalidad del carrito.
            this.mensajeCarrito.set(
                'Tu sesión está activa. La funcionalidad del carrito estará disponible próximamente.'
            );

        });
    }

}
