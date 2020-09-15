import { LightningElement,wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FOLDER_OBJECT from '@salesforce/schema/ContentFolder';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';

export default class FolderAddForm extends LightningElement {
    folderObject = FOLDER_OBJECT;
    ParentContentFolderId;
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        fields.ParentContentFolderId = this.ParentContentFolderId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }
    handleSuccess() {
        const evt = new ShowToastEvent({
            title: SUCCESS_TITLE,
            variant: SUCCESS_VARIANT
        });
        this.dispatchEvent(evt);
    }
    connectedCallback(){
        this.subscribeMC();
    }
    subscribeMC() {
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(
            this.messageContext,
            recordSelected, (message) => {
                this.handleMessage(message);
            });
    }

    unsubscribeMC() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
    //handle keyword from search component
    handleMessage(message){
        if(message.tree){
            this.ParentContentFolderId = message.folderId;
            console.log('lha9 l message --> ',message.folderId); 
        }
    }
    // wired message context
    @wire(MessageContext)
    messageContext;
}
