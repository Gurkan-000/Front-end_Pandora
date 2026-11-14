
export interface ResponseResumenDashboard {
    ventasTotales: number;
    cantidadPedidos: number;
    unidadesVendidas: number;
    ticketPromedio: number;
    variacionVentas: number;
    variacionPedidos: number;
    variacionUnidades: number;
    variacionTicketPromedio: number;
}

export interface ResponseVentaDiariaDashboard {
    fecha: string;
    ventas: number;
    cantidadPedidos: number;
}

export interface ResponseProductoMasVendidoDashboard {
    idProducto: string;
    nombreProducto: string;
    urlImagen: string;
    unidadesVendidas: number;
    importeTotal: number;
}

export interface ResponseVentaCategoriaDashboard {
    idCategoria: string;
    nombreCategoria: string;
    ventasTotales: number;
    unidadesVendidas: number;
}

export interface ResponsePedidoRecienteDashboard {
    idPedido: string;
    correo: string;
    estadoPedido: 'PENDIENTE' | 'ENVIADO' | 'ENTREGADO';
    fechaPedido: string;
    pagoTotal: number;
}

export type EstadoAlertaStock = 'AGOTADO' | 'STOCK_BAJO';

export interface ResponseVarianteAlertaStockDashboard {
    idVarianteProducto: string;
    idProducto: string;
    nombreProducto: string;
    atributos: string;
    stock: number;
    estado: EstadoAlertaStock;
}

export interface ResponseAlertasStockDashboard {
    stockMinimoGlobal: number;
    cantidadVariantesStockBajo: number;
    cantidadVariantesAgotadas: number;
    variantes: ResponseVarianteAlertaStockDashboard[];
}
