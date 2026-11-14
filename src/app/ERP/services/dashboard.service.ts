
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    ResponseResumenDashboard,
    ResponseVentaDiariaDashboard,
    ResponseProductoMasVendidoDashboard,
    ResponseVentaCategoriaDashboard,
    ResponsePedidoRecienteDashboard,
    ResponseAlertasStockDashboard
} from '../interfaces/dashboard.interface';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:8080/api/dashboard';


    obtenerResumen(fecha: string): Observable<ResponseResumenDashboard> {

        const params = new HttpParams()
            .set('fecha', fecha);

        return this.http.get<ResponseResumenDashboard>(
            `${this.apiUrl}/resumen`,
            { params }
        );

    }


    obtenerVentas(
        fechaInicio: string,
        fechaFin: string
    ): Observable<ResponseVentaDiariaDashboard[]> {

        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get<ResponseVentaDiariaDashboard[]>(
            `${this.apiUrl}/ventas`,
            { params }
        );

    }


    obtenerProductosMasVendidos(
        fechaInicio: string,
        fechaFin: string
    ): Observable<ResponseProductoMasVendidoDashboard[]> {

        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get<ResponseProductoMasVendidoDashboard[]>(
            `${this.apiUrl}/productos-mas-vendidos`,
            { params }
        );

    }


    obtenerVentasPorCategoria(
        fechaInicio: string,
        fechaFin: string
    ): Observable<ResponseVentaCategoriaDashboard[]> {

        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get<ResponseVentaCategoriaDashboard[]>(
            `${this.apiUrl}/ventas-categoria`,
            { params }
        );

    }


    obtenerPedidosRecientes(): Observable<ResponsePedidoRecienteDashboard[]> {

        return this.http.get<ResponsePedidoRecienteDashboard[]>(
            `${this.apiUrl}/pedidos-recientes`
        );

    }


    obtenerAlertasStock(): Observable<ResponseAlertasStockDashboard> {

        return this.http.get<ResponseAlertasStockDashboard>(
            `${this.apiUrl}/alertas-stock`
        );

    }

}
