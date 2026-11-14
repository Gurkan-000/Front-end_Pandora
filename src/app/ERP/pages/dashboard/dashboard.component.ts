import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';

import {
    ResponseResumenDashboard,
    ResponseVentaDiariaDashboard,
    ResponseProductoMasVendidoDashboard,
    ResponseVentaCategoriaDashboard,
    ResponsePedidoRecienteDashboard,
    ResponseAlertasStockDashboard
} from '../../interfaces/dashboard.interface';

Chart.register(...registerables);

@Component({
    selector: 'app-erp-dashboard',
    standalone: true,
    imports: [BaseChartDirective],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardERPComponent {

    private readonly dashboardService = inject(DashboardService);

    private readonly destroyRef = inject(DestroyRef);

    // Datos
    readonly resumen = signal<ResponseResumenDashboard | null>(null);

    readonly ventas = signal<ResponseVentaDiariaDashboard[]>([]);

    readonly productosMasVendidos =
        signal<ResponseProductoMasVendidoDashboard[]>([]);

    readonly ventasPorCategoria =
        signal<ResponseVentaCategoriaDashboard[]>([]);

    readonly pedidosRecientes =
        signal<ResponsePedidoRecienteDashboard[]>([]);

    readonly alertasStock =
        signal<ResponseAlertasStockDashboard | null>(null);


    // Estados de carga independientes
    readonly cargandoResumen = signal(true);
    readonly cargandoVentas = signal(true);
    readonly cargandoProductos = signal(true);
    readonly cargandoCategorias = signal(true);
    readonly cargandoPedidos = signal(true);
    readonly cargandoAlertas = signal(true);


    // Errores independientes
    readonly errorResumen = signal('');
    readonly errorVentas = signal('');
    readonly errorProductos = signal('');
    readonly errorCategorias = signal('');
    readonly errorPedidos = signal('');
    readonly errorAlertas = signal('');


    // Semana seleccionada: siempre comienza un lunes.
    readonly semanaSeleccionada = signal(
        this.obtenerLunesSemana(new Date())
    );

    // Fechas calculadas para las consultas.
    readonly fechaInicio = computed(() =>
        this.semanaSeleccionada()
    );

    readonly fechaFin = computed(() => {

        const lunes = this.convertirFecha(this.semanaSeleccionada());

        const domingo = this.sumarDias(lunes, 6);

        const hoy = new Date();

        // La semana actual no debe consultar días futuros.
        if (domingo > hoy) {
            return this.obtenerFechaLocal(hoy);
        }

        return this.obtenerFechaLocal(domingo);

    });

    // Permite saber si estamos consultando la semana actual.
    readonly esSemanaActual = computed(() =>
        this.semanaSeleccionada() === this.obtenerLunesSemana(new Date())
    );

    // Impide avanzar hacia semanas futuras.
    readonly puedeAvanzarSemana = computed(() =>
        this.semanaSeleccionada() < this.obtenerLunesSemana(new Date())
    );

    // Texto del periodo seleccionado.
    readonly periodoSemana = computed(() => {

        const inicio = this.convertirFecha(this.fechaInicio());
        const fin = this.convertirFecha(this.fechaFin());

        const formato = new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        return `${formato.format(inicio)} — ${formato.format(fin)}`;

    });


    constructor() {
        this.cargarDashboard();
    }


    cambiarSemana(direccion: number): void {

        const semanaActual = this.convertirFecha(
            this.semanaSeleccionada()
        );

        const nuevaSemana = this.sumarDias(
            semanaActual,
            direccion * 7
        );

        const nuevaFecha = this.obtenerFechaLocal(nuevaSemana);

        // No permitir avanzar hacia semanas futuras.
        if (nuevaFecha > this.obtenerLunesSemana(new Date())) {
            return;
        }

        this.semanaSeleccionada.set(nuevaFecha);

        // Solo recargamos la información que depende del periodo.
        this.cargarDatosPeriodo();

    }


    // Datos del gráfico de evolución de ventas
    readonly ventasChartData = computed(() => ({
        labels: this.ventas().map(venta =>
            new Intl.DateTimeFormat('es-PE', {
                day: '2-digit',
                month: 'short'
            }).format(new Date(`${venta.fecha}T00:00:00`))
        ),
        datasets: [
            {
                label: 'Ventas',
                data: this.ventas().map(venta => venta.ventas),
                borderColor: '#6c3f8f',
                backgroundColor: 'rgba(108, 63, 143, 0.12)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.35,
                fill: true
            }
        ]
    }));

    readonly ventasChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };


    // Datos del gráfico de productos más vendidos
    readonly productosChartData = computed(() => ({
        labels: this.productosMasVendidos().map(
            producto => producto.nombreProducto
        ),
        datasets: [
            {
                label: 'Unidades vendidas',
                data: this.productosMasVendidos().map(
                    producto => producto.unidadesVendidas
                ),
                backgroundColor: '#6c3f8f',
                borderRadius: 6,
                barThickness: 22
            }
        ]
    }));

    readonly productosChartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };


    // Datos del gráfico de ventas por categoría
    readonly categoriasChartData = computed(() => ({
        labels: this.ventasPorCategoria().map(
            categoria => categoria.nombreCategoria
        ),
        datasets: [
            {
                label: 'Ventas',
                data: this.ventasPorCategoria().map(
                    categoria => categoria.ventasTotales
                ),
                backgroundColor: [
                    '#6c3f8f',
                    '#9872b8',
                    '#c0a5d8',
                    '#e0d1ed',
                    '#8c789b',
                    '#b8a9c5'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    }));

    readonly categoriasChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const
            }
        }
    };


    cargarDashboard(): void {

        this.cargarDatosPeriodo();

        this.cargarPedidosRecientes();
        this.cargarAlertasStock();

    }


    // Carga todo lo que depende de la semana seleccionada.
    private cargarDatosPeriodo(): void {

        this.cargarResumen();
        this.cargarVentas();
        this.cargarProductosMasVendidos();
        this.cargarVentasPorCategoria();

    }


    private cargarResumen(): void {

        this.cargandoResumen.set(true);
        this.errorResumen.set('');

        this.dashboardService.obtenerResumen(
            this.semanaSeleccionada()
        ).pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cargandoResumen.set(false))
        ).subscribe({

            next: (respuesta) => {
                this.resumen.set(respuesta);
            },

            error: (error: HttpErrorResponse) => {
                this.errorResumen.set(this.obtenerMensajeError(error));
            }

        });

    }


    private cargarVentas(): void {

        this.cargandoVentas.set(true);
        this.errorVentas.set('');

        this.dashboardService.obtenerVentas(
            this.fechaInicio(),
            this.fechaFin()
        ).pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cargandoVentas.set(false))
        ).subscribe({

            next: (respuesta) => {
                this.ventas.set(respuesta);
            },

            error: (error: HttpErrorResponse) => {
                this.errorVentas.set(this.obtenerMensajeError(error));
            }

        });

    }


    private cargarProductosMasVendidos(): void {

        this.cargandoProductos.set(true);
        this.errorProductos.set('');

        this.dashboardService.obtenerProductosMasVendidos(
            this.fechaInicio(),
            this.fechaFin()
        ).pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cargandoProductos.set(false))
        ).subscribe({

            next: (respuesta) => {
                this.productosMasVendidos.set(respuesta);
            },

            error: (error: HttpErrorResponse) => {
                this.errorProductos.set(this.obtenerMensajeError(error));
            }

        });

    }


    private cargarVentasPorCategoria(): void {

        this.cargandoCategorias.set(true);
        this.errorCategorias.set('');

        this.dashboardService.obtenerVentasPorCategoria(
            this.fechaInicio(),
            this.fechaFin()
        ).pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cargandoCategorias.set(false))
        ).subscribe({

            next: (respuesta) => {
                this.ventasPorCategoria.set(respuesta);
            },

            error: (error: HttpErrorResponse) => {
                this.errorCategorias.set(this.obtenerMensajeError(error));
            }

        });

    }


    private cargarPedidosRecientes(): void {

        this.cargandoPedidos.set(true);
        this.errorPedidos.set('');

        this.dashboardService.obtenerPedidosRecientes().pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cargandoPedidos.set(false))
        ).subscribe({

            next: (respuesta) => {
                this.pedidosRecientes.set(respuesta);
            },

            error: (error: HttpErrorResponse) => {
                this.errorPedidos.set(this.obtenerMensajeError(error));
            }

        });

    }


    private cargarAlertasStock(): void {

        this.cargandoAlertas.set(true);
        this.errorAlertas.set('');

        this.dashboardService.obtenerAlertasStock().pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.cargandoAlertas.set(false))
        ).subscribe({

            next: (respuesta) => {
                this.alertasStock.set(respuesta);
            },

            error: (error: HttpErrorResponse) => {
                this.errorAlertas.set(this.obtenerMensajeError(error));
            }

        });

    }


    private obtenerMensajeError(error: HttpErrorResponse): string {

        if (error.status === 0) {
            return 'No se pudo conectar con el servidor.';
        }

        if (error.status >= 500) {
            return 'Ocurrió un error en el servidor.';
        }

        return error.error?.mensaje
            ?? error.error?.message
            ?? 'No se pudo cargar la información.';

    }


    // Utilidades de fechas
    private obtenerFechaLocal(fecha: Date): string {

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;

    }


    private obtenerLunesSemana(fecha: Date): string {

        const resultado = new Date(fecha);

        const dia = resultado.getDay();

        const diferencia = dia === 0 ? -6 : 1 - dia;

        resultado.setDate(resultado.getDate() + diferencia);

        return this.obtenerFechaLocal(resultado);

    }


    private convertirFecha(fecha: string): Date {

        const [anio, mes, dia] = fecha.split('-').map(Number);

        return new Date(anio, mes - 1, dia);

    }


    private sumarDias(fecha: Date, dias: number): Date {

        const resultado = new Date(fecha);

        resultado.setDate(resultado.getDate() + dias);

        return resultado;

    }


    // Formateo para la vista
    formatearMoneda(valor: number | null | undefined): string {

        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(valor ?? 0);

    }


    formatearFecha(fecha: string): string {

        // Si viene solo la fecha (yyyy-MM-dd), se evita la interpretación en UTC
        // que podría mostrar el día anterior en Perú.
        const fechaConvertida = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
            ? this.convertirFecha(fecha)
            : new Date(fecha);

        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(fechaConvertida);

    }


    obtenerClaseEstado(estado: string): string {

        switch (estado) {
            case 'PENDIENTE':
                return 'estado-pendiente';

            case 'ENVIADO':
                return 'estado-enviado';

            case 'ENTREGADO':
                return 'estado-entregado';

            default:
                return '';

        }

    }


    formatearVariacion(valor: number): string {

        const signo = valor > 0 ? '+' : '';

        return `${signo}${valor.toFixed(1)}%`;

    }


    obtenerClaseVariacion(valor: number): string {

        if (valor > 0) {
            return 'variacion-positiva';
        }

        if (valor < 0) {
            return 'variacion-negativa';
        }

        return 'variacion-neutral';

    }


    obtenerIconoVariacion(valor: number): string {

        if (valor > 0) {
            return '↑';
        }

        if (valor < 0) {
            return '↓';
        }

        return '—';

    }

}