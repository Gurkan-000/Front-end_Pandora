export interface ItemMenu {
    etiqueta: string;
    ruta: string;
    // Atributo "d" de un <path> SVG (viewBox 24x24, trazo).
    icono: string;
}

export interface SeccionMenu {
    titulo?: string;
    items: ItemMenu[];
}

/*
 * Menú del ERP.
 *
 * El orden de "Catálogo" sigue las dependencias del backend:
 * un producto necesita marca, subcategoría (que pertenece a una categoría)
 * y atributos (Color, Talla, etc.). Los valores de cada atributo
 * (Rojo, M, L...) se gestionan dentro del módulo Atributos y son los que
 * luego se combinan en las variantes de cada producto (stock + imagen).
 *
 * Para agregar un módulo nuevo basta con añadir un item aquí
 * y registrar su ruta hija en app.routes.ts.
 */
export const MENU_ERP: SeccionMenu[] = [
    {
        items: [
            {
                etiqueta: 'Dashboard',
                ruta: '/erp/dashboard',
                icono: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z'
            }
        ]
    },
    {
        titulo: 'Punto de Venta',
        items: [
            {
                etiqueta: 'Pedidos',
                ruta: '/erp/pedidos',
                icono: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2H9V5z M9 12h6 M9 16h6'
            },
            {
                etiqueta: 'Carrito',
                ruta: '/erp/carrito',
                icono: 'M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6 M10 21h.01 M18 21h.01'
            },
            {
                etiqueta: 'Ventas',
                ruta: '/erp/ventas',
                icono: 'M4 2h16v20H4z M8 6h8 M8 10h8 M8 14h4 M8 18h8'
            }
        ]
    },
    {
        titulo: 'Catálogo',
        items: [
            {
                etiqueta: 'Categorías',
                ruta: '/erp/categorias',
                icono: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5'
            },
            {
                etiqueta: 'Marcas',
                ruta: '/erp/marcas',
                icono: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01'
            },
            {
                etiqueta: 'Atributos',
                ruta: '/erp/atributos',
                icono: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6'
            }
        ]
    },
    {
        titulo: 'Productos',
        items: [
            {
                etiqueta: 'Productos',
                ruta: '/erp/productos',
                icono: 'M16.5 9.4 7.5 4.21 M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01l8.73-5.05 M12 22.08V12'
            }
        ]
    }
];
