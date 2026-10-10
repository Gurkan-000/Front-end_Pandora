import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { FooterERPComponent } from '../footer/footer.component';
import { SidebarERPComponent } from '../sidebar/sidebar.component';
import { TopbarERPComponent } from '../topbar/topbar.component';

@Component({
    selector: 'app-erp-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        SidebarERPComponent,
        TopbarERPComponent,
        FooterERPComponent
    ],
    templateUrl: './erp-layout.component.html',
    styleUrl: './erp-layout.component.css'
})
export class LayoutERPComponent {

    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    // El usuario lo carga erpGuard antes de mostrar el layout.
    readonly usuario = this.authService.usuarioActual;

    menuAbierto = signal(false);
    cerrandoSesion = signal(false);

    alternarMenu(): void {
        this.menuAbierto.update(abierto => !abierto);
    }

    cerrarMenu(): void {
        this.menuAbierto.set(false);
    }

    cerrarSesion(): void {

        this.cerrandoSesion.set(true);

        this.authService.cerrarSesion().pipe(
            finalize(() => {
                this.cerrandoSesion.set(false);
                this.authService.limpiarSesionLocal();
                this.router.navigate(['/erp/login']);
            })
        ).subscribe({
            error: (error) => console.error('Error al cerrar sesión:', error)
        });
    }
}
