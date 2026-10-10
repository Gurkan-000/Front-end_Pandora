import { Component } from '@angular/core';

@Component({
    selector: 'app-erp-footer',
    standalone: true,
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css'
})
export class FooterERPComponent {

    readonly anio = new Date().getFullYear();
}
