import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MENU_ERP } from './sidebar-items';

@Component({
    selector: 'app-erp-sidebar',
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive
    ],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarERPComponent {

    // Solo aplica en pantallas pequeñas (en escritorio el menú siempre es visible).
    abierto = input(false);

    cerrar = output<void>();

    readonly secciones = MENU_ERP;
}
