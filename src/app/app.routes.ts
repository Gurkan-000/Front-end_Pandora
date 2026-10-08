import { Routes } from '@angular/router';

import { LoginCommerceComponent } from './E-Commerce/pages/login/login.component';
import { LoginERPComponent } from './ERP/pages/login/login.component';
import { RecuperarContrasenaComponent } from './E-Commerce/pages/recuperacionCuenta/recuperar-contrasena.component';

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
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];