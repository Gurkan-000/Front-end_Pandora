export interface Product {
    idProducto: string;
    nombreProducto: string;
    descripcion: string;
    nombreMarca: string;
    nombreCategoria: string;
    nombreSubcategoria: string;
    precio: number;
    precioAnterior?: number;
    urlImagen: string;
    stock: number;
    rating?: number;
    reviews?: number;
    badge?: string;
}