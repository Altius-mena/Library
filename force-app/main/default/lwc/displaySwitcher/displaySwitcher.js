import { LightningElement, wire } from 'lwc';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
export default class DisplaySwitcher extends LightningElement {
    isGallery = true;
    isTable = false;
    switchToGallery(){
        this.isGallery = true;
        this.isTable = false;
        this.sendMessageService();
        this.template.querySelector('.gallery').classList.add('dynamicCSS');
        this.template.querySelector('.table').classList.remove('dynamicCSS');
    }
    switchToTable(){
        this.isTable = true;
        this.isGallery = false;
        this.sendMessageService();
        //console.log(this.template.querySelector('.table . slds-button_icon-border-filled'));
        this.template.querySelector('.table').classList.add('dynamicCSS');
        this.template.querySelector('.gallery').classList.remove('dynamicCSS');
    }
    // wired message context
    @wire(MessageContext)
    messageContext;

    // Publishes the selected display type.
    sendMessageService() { 
        // explicitly pass isGallery isTable to the parameter type display
        publish(this.messageContext, recordSelected, { gallery : this.isGallery , table : this.isTable });
        console.log('message was published with this values --> ',this.isGallery,this.isTable);
    }
    renderedCallback(){
        this.applyClickedButtonCss();
    }
    applyClickedButtonCss(){
        const treeElement = this.template.querySelector("lightning-button-icon");
        let style = document.createElement("style");
        style.innerHTML = ".dynamicCSS .slds-button {  color: white;background-color: gray;}";
        treeElement.appendChild(style);
    }
}