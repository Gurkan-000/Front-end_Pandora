export interface CrearVarianteProductoRequest {
    idValorAtributos: string[];
    stock: number;
    urlImagen: string | null;
    esPrincipal: boolean;
}