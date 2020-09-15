import { LightningElement, track, wire } from 'lwc';
import createFolder from '@salesforce/apex/LibraryExplorer.createFolder';
import deleteFolder from '@salesforce/apex/LibraryExplorer.deleteFolder';
import moveFolder from '@salesforce/apex/LibraryExplorer.moveFolder';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
const ERROR_VARIANT = 'error';
const ERROR_TITLE = 'Error creating folder';

const SUCCESS_VARIANT = 'success';
const SUCCESS_TITLE = 'Success creating folder'

export default class FolderActions extends LightningElement {
    @track isModalOpenCreateFolder = false;
    @track isModalOpenMoveFolder = false;
    @track isModalOpenDeleteFolder = false;
    parentDeletedFolder;
    ParentContentFolderId;
    createdFolderId;
    sourceMove;
    targetMove;
    //create
    openModalCreateFolder() {
        // to open modal set isModalOpen tarck value as true
        this.isModalOpenCreateFolder = true;
    }
    closeModalCreateFolder() {
        // to close modal set isModalOpen tarck value as false
        this.isModalOpenCreateFolder = false;
    }

    //delete
    openModalDeleteFolder() {
        this.isModalOpenDeleteFolder = true;
    }
    closeModalDeleteFolder() {
        this.isModalOpenDeleteFolder = false;
    }

    //move
    openModalMoveFolder() {
        this.isModalOpenMoveFolder = true;
    }
    closeModalMoveFolder() {
        this.isModalOpenMoveFolder = false;
    }


    newFolder() {
        // to close modal set isModalOpen tarck value as false
        //Add your code to call apex method or do some processing
        var name = this.template.querySelector('lightning-input[data-my-id=name]').value;
        createFolder({
            contentFolderId: this.ParentContentFolderId,
            name: name
        })
            .then(result => {
                this.createdFolderId = result;
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The folder was created successfully !',
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
        this.isModalOpenCreateFolder = false;
    }
    deleteContentFolder(){
        console.log('---> ',this.ParentContentFolderId);
        deleteFolder({
            contentFolderId: this.ParentContentFolderId,
        })
            .then(result => {
                this.createdFolderId = result;
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The folder was deleted successfully !',
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
        this.isModalOpenDeleteFolder = false;
    }
    
    moveContentFolder(){
        moveFolder({
            source: this.sourceMove,
            target: this.targetMove
        })
            .then(result => {
                this.createdFolderId = this.sourceMove;
                const event = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: 'The folder was moved successfully !',
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
        this.isModalOpenMoveFolder = false;
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
            this.ParentContentFolderId = message.currentLibraryId;
        }
        if(message.currentFolderId){
            this.ParentContentFolderId = message.currentFolderId;
        }
        if(message.source && message.target){
            this.sourceMove = message.source;
            this.targetMove = message.target;
        }

    }
    // wired message context
    @wire(MessageContext)
    messageContext;

    // Publishes the refreh.
    sendMessageServiceToRefresh() { 
        publish(this.messageContext, recordSelected, { refreshFolder : true , createdFolderId : this.createdFolderId});
    }
}