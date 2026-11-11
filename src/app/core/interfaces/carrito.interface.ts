
export interface ResponseCarrito {
    idCarrito: string;
    idUsuario: string;
    precioTotal: number;
    cantidadProductos: number;
    detallesCarrito: ResponseDetalleCarrito[];
}

export interface ResponseDetalleCarrito {
    idDetalleCarrito: string;
    idCarrito: string;
    idVarianteProducto: string;
    nombreProducto: string;
    precioUnitario: number;
    cantidad: number;
    precioSubTotal: number;
}
