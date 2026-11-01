import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

import { Product } from './product.interface';

@Component({
    selector: 'app-product-card',
    imports: [CurrencyPipe, NgOptimizedImage],
    templateUrl: './product-card.component.html',
    styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
    readonly product = input.required<Product>();
    readonly favorite = input(false);
    readonly favoriteToggled = output<string>();
    readonly addRequested = output<Product>();
}