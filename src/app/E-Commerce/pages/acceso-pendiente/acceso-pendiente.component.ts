import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
    selector: 'app-acceso-pendiente',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './acceso-pendiente.component.html',
    styleUrl: './acceso-pendiente.component.css'
})
export class AccesoPendienteComponent {

    private readonly route = inject(ActivatedRoute);

    protected readonly contenido = toSignal(
        this.route.data.pipe(
            map(data => ({
                etiqueta: String(data['etiqueta'] ?? 'Mi cuenta'),
                titulo: String(data['titulo'] ?? 'Próximamente'),
                descripcion: String(data['descripcion'] ?? ''),
                icono: String(data['icono'] ?? 'package')
            }))
        ),
        {
            initialValue: {
                etiqueta: 'Mi cuenta',
                titulo: 'Próximamente',
                descripcion: '',
                icono: 'package'
            }
        }
    );
}