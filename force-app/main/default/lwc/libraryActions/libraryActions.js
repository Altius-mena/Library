import { LightningElement, track, wire } from 'lwc';
import createLibrary from '@salesforce/apex/LibraryExplorer.createLibrary';
import deleteLibrary from '@salesforce/apex/LibraryExplorer.deleteLibrary';
import editLibrary from '@salesforce/apex/LibraryExplorer.editLibrary';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
const ERROR_VARIANT = 'error';
const ERROR_TITLE = 'Error creating Library';

const SUCCESS_VARIANT = 'success';
const SUCCESS_TITLE = 'Success creating Library'


export default class LibraryActions extends LightningElement {
    @track isModalOpenCreateLibrary = false;
    @track isModalOpenEditLibrary = false;
    @track isModalOpenDeleteLibrary = false;
    parentDeletedLibrary;
    ParentContentLibraryId;
    createdLibraryId;
    sourceEdit;
    targetEdit;
    //create
    openModalCreateLibrary() {
        // to open modal set isModalOpen tarck value as true
        this.isModalOpenCreateLibrary = true;
    }
    closeModalCreateLibrary() {
        // to close modal set isModalOpen tarck value as false
        this.isModalOpenCreateLibrary = false;
    }

    //delete
    openModalDeleteLibrary() {
        this.isModalOpenDeleteLibrary = true;
    }
    closeModalDeleteLibrary() {
        this.isModalOpenDeleteLibrary = false;
    }

    //Edit
    openModalEditLibrary() {
        this.isModalOpenEditLibrary = true;
    }
    closeModalEditLibrary() {
        this.isModalOpenEditLibrary = false;
    }


    newLibrary() {
        // to close modal set isModalOpen tarck value as false
        //Add your code to call apex method or do some processing
        var name = this.template.querySelector('lightning-input[data-my-id=name]').value;
        var description = this.template.querySelector('lightning-input[data-my-id=description]').value;
        createLibrary({
            name: name,
            description: description
        })
            .then(result => {
                this.createdLibraryId = result;
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The Library was created successfully !',
                    variant: SUCCESS_VARIANT
                });
                this.sendMessageServiceToRefresh();
                this.dispatchEvent(event);
                
            })
            .catch(error => {
                const event = new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error,
                    variant: ERROR_VARIANT
                });
                this.dispatchEvent(event);
            });
        this.isModalOpenCreateLibrary = false;
    }
    deleteContentLibrary(){
        console.log('---> ',this.ParentContentLibraryId);
        deleteLibrary({
            contentLibraryId: this.ParentContentLibraryId,
        })
            .then(result => {
                this.createdLibraryId = result;
                console.log('result --> ',result);
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The Library was deleted successfully !',
                    variant: SUCCESS_VARIANT
                });
                this.sendMessageServiceToRefresh();
                this.dispatchEvent(event);
                
            })
            .catch(error => {
                const event = new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error,
                    variant: ERROR_VARIANT
                });
                this.dispatchEvent(event);
            });
        this.isModalOpenDeleteLibrary = false;
    }
    
    EditContentLibrary(){
        editLibrary({
            source: this.sourceEdit,
            target: this.targetEdit
        })
            .then(result => {
                this.createdLibraryId = this.sourceEdit;
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The Library was Editd successfully !',
                    variant: SUCCESS_VARIANT
                });
                this.sendMessageServiceToRefresh();
                this.dispatchEvent(event);
                
            })
            .catch(error => {
                const event = new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error,
                    variant: ERROR_VARIANT
                });
                this.dispatchEvent(event);
            });
        this.isModalOpenEditLibrary = false;
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
        if(message.currentLibraryId){
            this.ParentContentLibraryId = message.currentLibraryId;
        }
        if(message.currentLibraryId){
            this.ParentContentLibraryId = message.currentLibraryId;
        }
        if(message.source && message.target){
            this.sourceEdit = message.source;
            this.targetEdit = message.target;
        }

    }
    // wired message context
    @wire(MessageContext)
    messageContext;

    // Publishes the refreh.
    sendMessageServiceToRefresh() { 
        publish(this.messageContext, recordSelected, { refreshLibrary : true , createdLibraryId : this.createdLibraryId});
        console.log('publish refresh librarywith this value ',this.createdLibraryId);
    }
}