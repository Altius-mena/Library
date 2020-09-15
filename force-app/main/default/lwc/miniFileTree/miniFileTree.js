import { LightningElement, wire, api, track } from 'lwc';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';

export default class MiniFileTree extends LightningElement {
    // private
    @track items = [];
    loading = true;
    subscription = null;
    map ={};
    sourceFolderId;
    targetFolderId;
    libraryLabel;
    handleOnselect(event){       
        this.targetFolderId = event.detail.name;
        this.expandFolderById(this.targetFolderId);
        console.log('source --> ',this.sourceFolderId);
        console.log('target --> ',this.targetFolderId);
        this.sendSourceTargetMoveFolderOpertaion();
    }
    expandFolderById(folderId){
        var index = this.map[folderId];
        var ndx = index.split('.');
        var treeElement = this.template.querySelector('lightning-tree');
            for (let i = 1; i < ndx.length; i += 1) {
                treeElement = treeElement.items[ndx[i]];
            }
            treeElement.expanded = !treeElement.expanded;
    }
    connectedCallback(){
        this.subscribeMC();
        this.sendMessageGetItem();
    }
    // wired message context
    @wire(MessageContext)
    messageContext;
    
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
    handleMessage(message){
        if(message.sortedTree){
            this.items = message.sortedTree;
        }
        if(message.map){
            this.map = message.map;
        }
        if(message.currentLibraryLabel){
            this.libraryLabel = message.currentLibraryLabel;
        }
        if(message.sourceFolderId){
            this.sourceFolderId = message.sourceFolderId;
        }
    }
    sendMessageGetItem(){
        publish(this.messageContext, recordSelected, { getItems : true });
    }
    sendSourceTargetMoveFolderOpertaion(){
        publish(this.messageContext, recordSelected, { source : this.sourceFolderId, target :this.targetFolderId  });

    }
    
}