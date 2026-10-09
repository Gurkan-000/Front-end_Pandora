import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-footer',
    imports: [RouterLink],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css'
})
export class FooterComponent {
    volverArriba(event: Event): void {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}