
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-modal-variante-principal',
    standalone: true,
    templateUrl: './modal-variante-principal.component.html',
    styleUrl: './modal-variante-principal.component.css'
})
export class ModalVariantePrincipalComponent {
    @Output() cerrar = new EventEmitter<void>();

    cerrarModal(): void {
        this.cerrar.emit();
    }
}
