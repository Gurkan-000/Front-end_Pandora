import { Routes } from '@angular/router';

import { LoginCommerceComponent } from './E-Commerce/pages/login/login.component';
import { LoginERPComponent } from './ERP/pages/login/login.component';
import { RecuperarContrasenaComponent } from './E-Commerce/pages/recuperacionCuenta/recuperar-contrasena.component';
import { LayoutERPComponent } from './ERP/layout/erp-layout/erp-layout.component';
import { DashboardERPComponent } from './ERP/pages/dashboard/dashboard.component';
import { erpGuard } from './core/guards/erp.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginCommerceComponent
    },
    {
        path: 'erp/login',
        component: LoginERPComponent
    },
    {
        // Todas las páginas del ERP (excepto el login) viven dentro del layout.
        // Para agregar una página nueva, añádela como hija de este bloque.
        path: 'erp',
        component: LayoutERPComponent,
        canActivate: [erpGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: DashboardERPComponent
            },
            {
                path: 'categorias',
                loadComponent: () => import('./ERP/pages/features/catalogo/categoria/categoria.component')
                    .then((module) => module.CategoriaERPComponent)
            },
            {
                path: 'subcategorias',
                data: { resource: 'subcategoria' },
                loadComponent: () => import('./ERP/pages/features/catalogo/catalogo-recurso.component')
                    .then((module) => module.CatalogoRecursoERPComponent)
            },
            {
                path: 'marcas',
                data: { resource: 'marca' },
                loadComponent: () => import('./ERP/pages/features/catalogo/catalogo-recurso.component')
                    .then((module) => module.CatalogoRecursoERPComponent)
            },
            {
                path: 'atributos',
                data: { resource: 'atributo' },
                loadComponent: () => import('./ERP/pages/features/catalogo/catalogo-recurso.component')
                    .then((module) => module.CatalogoRecursoERPComponent)
            },
            {
                path: 'valores-atributos',
                data: { resource: 'valorAtributo' },
                loadComponent: () => import('./ERP/pages/features/catalogo/catalogo-recurso.component')
                    .then((module) => module.CatalogoRecursoERPComponent)
            },
            {
                path: '**',
                redirectTo: 'dashboard'
            }
        ]
    },
    {
        path: 'recuperar-contrasena',
        component: RecuperarContrasenaComponent
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];