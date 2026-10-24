
export interface ResponseValorAtributo {
    idValorAtributo: string;
    idAtributo: string;
    valor: string;
    nombreAtributo: string;
}

export interface ResponseVarianteProducto {
    idVarianteProducto: string;
    stock: number;
    urlImagen: string;
    esPrincipal: boolean;
    atributos: ResponseValorAtributo[];
}
