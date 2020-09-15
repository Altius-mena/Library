import { LightningElement, api, wire } from 'lwc';
import bulkServerMovetoFolder from '@salesforce/apex/LibraryExplorer.bulkServerMovetoFolder';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';

const ERROR_VARIANT = 'error';
const ERROR_TITLE = 'Error uploading file(s)';

const SUCCESS_VARIANT = 'success';
const SUCCESS_TITLE = 'Success uploading file(s)'

export default class FileUploader extends LightningElement {
    // private
    subscription = null;
    
    currentLibraryId;
    curentFolderId;

    // wired message context
    @wire(MessageContext)
    messageContext;

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
    handleMessage(message){
        if(message.currentFolderId){
            this.curentFolderId = message.currentFolderId;
        }
        if(message.currentLibraryId){
            this.currentLibraryId = message.currentLibraryId;
        }
    }

    unsubscribeMC() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
    handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        let joined='';
        uploadedFiles.forEach(element => {joined=joined.concat(',',element.documentId);});
        joined=joined.substring(1);
        if(!this.curentFolderId){
            this.curentFolderId = this.currentLibraryId;
        }
        bulkServerMovetoFolder({
            docIds: joined,
            folderId: this.curentFolderId
        })
            .then(result => {
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The file(s) has been uploaded successfully !',
                    variant: SUCCESS_VARIANT
                });
                this.dispatchEvent(event);
                this.sendMessageServiceToRefresh();
            })
            .catch(error => {
                const event = new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error,
                    variant: ERROR_VARIANT
                });
                this.dispatchEvent(event);
            });
    }
    // Publishes the refreh.
    sendMessageServiceToRefresh() { 
        publish(this.messageContext, recordSelected, { refresh : true});
        
    }
}
