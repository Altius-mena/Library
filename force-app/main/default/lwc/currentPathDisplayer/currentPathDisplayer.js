import { LightningElement, wire } from 'lwc';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
export default class CurrentPathDisplayer extends LightningElement {
    currentId;
    currentLabel;
    currentLibraryId;
    currentLibraryLabel;
    currentFolder;

    numberofItems;
    path = [];
    createPath(list,id){
        this.currentId = id;
        if(this.currentId === ''){
            this.currentFolder =this.path[0].label; 
            this.path = this.path.reverse();
            this.path.splice(this.path.length - 1, 1,);
            this.path.splice(0, 1,);
            
            return;
        }
        else{
            for (var i = 0; i < list.length; i++) {
                if (list[i].name === id){
                    this.currentId = list[i].ParentFolderId;
                    this.currentLabel = list[i].label;
                    this.path.push({id : this.currentId, label: this.currentLabel});
                    this.createPath(list,this.currentId);
                    break;
                }
            }   
        }
    }
    /*generateCurrentLocation(){
        for(var i = 0;i <this.path.length; i++){

        }
    }*/
    navigateTofolder(event){
        //console.log(event.detail.value);
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
            this.path = [];
            this.createPath(message.tree, message.folderId); 
        }
        if(message.currentLibraryId){
            this.currentLibraryId = message.currentLibraryId;
        }
        if(message.numberOfDocuments || message.numberOfDocuments === 0){
            this.numberofItems = message.numberOfDocuments;
        }
        if(message.currentLibraryLabel){
            this.currentLibraryLabel = message.currentLibraryLabel;
            this.currentFolder = this.currentLibraryLabel;
        }
    }
    // wired message context
    @wire(MessageContext)
    messageContext;
}