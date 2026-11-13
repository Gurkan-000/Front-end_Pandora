export interface ResponseDetallePedidoERP {
    idDetallePedido: string;
    idPedido: string;
    idVarianteProducto: string;
    nombreProducto: string;
    precioUnitario: number;
    cantidad: number;
    pagoSubtotal: number;
}

export interface ResponsePedidoDetalleERP {
    idPedido: string;
    idUsuario: string;
    correo: string;
    informacionAdicional: string;
    departamentoEntrega: string;
    distritoEntrega: string;
    direccionEntrega: string;
    estadoPedido: string;
    fechaPedido: string;
    pagoTotal: number;
    detalles: ResponseDetallePedidoERP[];
}