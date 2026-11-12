
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
import { CarritoService } from '../../../core/services/carrito.service';
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

    protected readonly agregandoAlCarrito = signal(false);

    private readonly carritoService = inject(CarritoService);

    readonly producto = signal<Product | null>(null);

    readonly variantes = signal<ProductVariantResponse[]>([]);

    readonly valoresSeleccionados = signal<Record<string, string>>({});

    readonly cargando = signal(true);

    readonly errorCarga = signal('');

    protected readonly cantidadSeleccionada = signal(1);

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

        this.cantidadSeleccionada.set(1);
    }

    protected actualizarCantidad(event: Event, stock: number): void {

        const input = event.target as HTMLInputElement;

        const valor = Number(input.value);

        const cantidad = input.value.trim() === '' || !Number.isFinite(valor)
            ? 1
            : Math.trunc(valor);

        const cantidadLimitada = Math.min(
            Math.max(cantidad, 1),
            stock
        );

        this.cantidadSeleccionada.set(cantidadLimitada);

        input.value = String(cantidadLimitada);
    }


    protected intentarAgregarAlCarrito(): void {

        const variante = this.varianteSeleccionada();

        const cantidad = this.cantidadSeleccionada();

        if (
            !variante ||
            variante.stock <= 0 ||
            cantidad < 1 ||
            cantidad > variante.stock ||
            this.agregandoAlCarrito()
        ) {
            return;
        }

        this.mensajeCarrito.set('');
        this.agregandoAlCarrito.set(true);

        this.carritoService.agregarProducto(
            variante.idVarianteProducto,
            cantidad
        ).pipe(

            catchError(error => {

                console.error('Error al añadir el producto al carrito:', error);
                console.error('Mensajes del backend:', error.error?.mensajes);

                if (error.status === 401) {
                    this.authService.limpiarSesionLocal();
                    void this.router.navigate(['/login']);
                    return EMPTY;
                }

                this.mensajeCarrito.set(
                    'No fue posible añadir el producto al carrito. Inténtalo nuevamente.'
                );

                return EMPTY;

            }),

            finalize(() => this.agregandoAlCarrito.set(false)),

            takeUntilDestroyed(this.destroyRef)

        ).subscribe(() => {

            this.mensajeCarrito.set(
                'Producto añadido correctamente al carrito.'
            );

        });

    }


}
