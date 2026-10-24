export interface ResponseMarca {
    idMarca: string;
    nombreMarca: string;
}

export interface ResponseSubcategoria {
    idSubCategoria: string;
    idCategoria: string;
    nombreCategoria: string;
    nombreSubCategoria: string;
}

export interface ResponseAtributo {
    idAtributo: string;
    nombreAtributo: string;
}

export interface CrearProductoRequest {
    nombreProducto: string;
    descripcion: string;
    precio: number;
    urlImagen: string;
    idAtributos: string[];
}

export interface ResponseImagen {
    urlImagen: string;
}