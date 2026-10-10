import {
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    computed,
    inject,
    input,
    output,
    signal
} from '@angular/core';

import { ResponseAuth } from '../../../core/interfaces/response-auth.interface';

const ROLES: Record<string, string> = {
    ADMIN: 'Administrador',
    CLIENTE: 'Cliente'
};

@Component({
    selector: 'app-erp-topbar',
    standalone: true,
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css'
})
export class TopbarERPComponent {

    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly destroyRef = inject(DestroyRef);

    usuario = input<ResponseAuth | null>(null);
    cerrandoSesion = input(false);

    alternarMenu = output<void>();
    cerrarSesion = output<void>();

    menuUsuarioAbierto = signal(false);

    // Reloj en vivo (se actualiza cada segundo).
    private readonly ahora = signal(new Date());

    private readonly formatoFecha = new Intl.DateTimeFormat('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    private readonly formatoHora = new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    fecha = computed(() => {
        const texto = this.formatoFecha.format(this.ahora());
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    });

    hora = computed(() => this.formatoHora.format(this.ahora()));

    nombreCompleto = computed(() => {
        const usuario = this.usuario();
        const nombre = `${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`.trim();

        return nombre || 'Usuario';
    });

    rolEtiqueta = computed(() => {
        const rol = this.usuario()?.rol;

        return rol ? (ROLES[rol] ?? rol) : '';
    });

    iniciales = computed(() => {
        const usuario = this.usuario();

        const letras = (usuario?.nombre?.charAt(0) ?? '') + (usuario?.apellido?.charAt(0) ?? '');

        return (letras || usuario?.correo?.charAt(0) || 'U').toUpperCase();
    });

    constructor() {
        const intervalo = setInterval(() => this.ahora.set(new Date()), 1000);

        this.destroyRef.onDestroy(() => clearInterval(intervalo));
    }

    alternarMenuUsuario(): void {
        this.menuUsuarioAbierto.update(abierto => !abierto);
    }

    solicitarCierreSesion(): void {
        this.cerrarSesion.emit();
    }

    // Cierra el desplegable al hacer clic fuera del topbar.
    @HostListener('document:click', ['$event'])
    clicFuera(evento: Event): void {
        if (!this.elementRef.nativeElement.contains(evento.target as Node)) {
            this.menuUsuarioAbierto.set(false);
        }
    }

    @HostListener('document:keydown.escape')
    cerrarConEscape(): void {
        this.menuUsuarioAbierto.set(false);
    }
}
