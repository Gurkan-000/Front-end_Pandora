import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrl: './confirmation-dialog.component.css'
})
export class ConfirmationDialogComponent {
    readonly title = input.required<string>();
    readonly message = input.required<string>();
    readonly confirmLabel = input('Sí, eliminar');
    readonly cancelLabel = input('Cancelar');
    readonly busy = input(false);
    readonly busyLabel = input('Procesando...');

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();
}