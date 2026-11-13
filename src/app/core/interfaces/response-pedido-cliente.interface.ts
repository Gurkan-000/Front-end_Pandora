export interface ResponsePedidoCliente {
    idPedido: string;
    idUsuario: string;
    idVenta: string | null;
    estadoPedido: string;
    fechaPedido: string;
    pagoTotal: number;
}