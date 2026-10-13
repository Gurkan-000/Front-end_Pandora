import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
    let fixture: ComponentFixture<ConfirmationDialogComponent>;
    let component: ConfirmationDialogComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConfirmationDialogComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmationDialogComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('title', '¿Eliminar producto?');
        fixture.componentRef.setInput('message', 'Se eliminará “Reloj”.');
        fixture.detectChanges();
    });

    it('renderiza el contenido configurable y emite confirmación', () => {
        const confirmed = vi.fn();
        component.confirmed.subscribe(confirmed);

        expect(fixture.nativeElement.textContent).toContain('¿Eliminar producto?');
        expect(fixture.nativeElement.textContent).toContain('Se eliminará “Reloj”.');
        fixture.nativeElement.querySelector('.danger-button').click();
        expect(confirmed).toHaveBeenCalledOnce();
    });

    it('emite cancelación al hacer clic en cancelar o en el fondo', () => {
        const cancelled = vi.fn();
        component.cancelled.subscribe(cancelled);

        fixture.nativeElement.querySelector('.secondary-button').click();
        fixture.nativeElement.querySelector('.dialog-backdrop').click();
        expect(cancelled).toHaveBeenCalledTimes(2);
    });

    it('bloquea las acciones mientras está ocupado', () => {
        fixture.componentRef.setInput('busy', true);
        fixture.componentRef.setInput('busyLabel', 'Eliminando producto...');
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
        expect(Array.from(buttons).every((button) => button.disabled)).toBe(true);
        expect(fixture.nativeElement.textContent).toContain('Eliminando producto...');
    });
});