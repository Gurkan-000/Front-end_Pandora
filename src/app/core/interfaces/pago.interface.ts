export interface ResponseInicioPago {
    idPedido: string;
    idOrdenPayPal: string;
    monto: string;
    moneda: string;
}

export interface RequestCapturaPago {
    idPedido: string;
    idOrdenPayPal: string;
}

export interface ResponsePagoConfirmado {
    idPedido: string;
    estadoPago: string;
    monto: number;
}