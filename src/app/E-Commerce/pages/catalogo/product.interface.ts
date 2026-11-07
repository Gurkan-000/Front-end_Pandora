
export interface Product {
    idProducto: string;
    nombreProducto: string;
    descripcion: string;
    nombreMarca: string;
    nombreCategoria: string;
    nombreSubcategoria: string;
    precio: number;
    urlImagen: string;
    cantidadVariantes: number;
}

export interface ProductApiResponse {
    idProducto: string;
    idSubCategoria: string;
    nombreProducto: string;
    descripcion: string;
    precio: number;
    urlImagen: string;
    nombreMarca: string;
    nombreSubcategoria: string;
    cantidadVariantes: number;
}

export interface ProductSubcategoryResponse {
    idSubCategoria: string;
    nombreCategoria: string;
}

export interface ProductVariantAttributeResponse {
    idValorAtributo: string;
    idAtributo: string;
    valor: string;
    nombreAtributo: string;
}

export interface ProductVariantResponse {
    idVarianteProducto: string;
    stock: number;
    urlImagen: string | null;
    esPrincipal: boolean;
    atributos: ProductVariantAttributeResponse[];
}
