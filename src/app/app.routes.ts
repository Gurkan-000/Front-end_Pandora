import { Routes } from '@angular/router';

import { LoginCommerceComponent } from './E-Commerce/pages/login/login.component';
import { LoginERPComponent } from './ERP/pages/login/login.component';
import { RecuperarContrasenaComponent } from './E-Commerce/pages/recuperacionCuenta/recuperar-contrasena.component';
import { MainLayoutComponent } from './E-Commerce/layout/main-layout/main-layout.component';

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
        path: 'recuperar-contrasena',
        component: RecuperarContrasenaComponent
    },
    {
        path: 'catalogo',
        component: MainLayoutComponent
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