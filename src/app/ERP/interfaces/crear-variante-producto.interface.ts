export interface CrearVarianteProductoRequest {
    idValorAtributos: string[];
    stock: number;
    urlImagen: string | null;
    esPrincipal: boolean;
}


export interface ActualizarVarianteProductoRequest {
    idValorAtributos: string[];
    stock: number;
    urlImagen: string | null;
    esPrincipal: boolean;
}
