import { LightningElement, wire } from 'lwc';
// Import message service features required for publishing and the message channel
import { publish, MessageContext } from 'lightning/messageService';
import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
export default class FolderSearch extends LightningElement {
    keyword;
    handleSearchCahnge(event){
        this.keyword = event.detail.value;
        this.sendMessageService(this.keyword);
    }
    // wired message context
    @wire(MessageContext)
    messageContext;

    // Publishes the keyword.
    sendMessageService(keyword) { 
        // explicitly pass keyword to the parameter key
        publish(this.messageContext, recordSelected, { keyFolder : keyword });
    }
}
