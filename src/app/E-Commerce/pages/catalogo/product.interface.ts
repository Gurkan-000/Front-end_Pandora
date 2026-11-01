export interface Product {
    idProducto: string;
    nombreProducto: string;
    descripcion: string;
    nombreMarca: string;
    nombreCategoria: string;
    nombreSubcategoria: string;
    precio: number;
    urlImagen: string;
    stock: number;
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
}

export interface ProductSubcategoryResponse {
    idSubCategoria: string;
    nombreCategoria: string;
}

export interface ProductVariantResponse {
    stock: number;
}