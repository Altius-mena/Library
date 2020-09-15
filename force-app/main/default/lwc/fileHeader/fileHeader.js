import { LightningElement } from 'lwc';
import HideLightningHeader from '@salesforce/resourceUrl/HideLightningHeader';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
export default class FileHeader extends LightningElement {
    connectedCallback() {
        loadStyle(this, HideLightningHeader);
    }
} 