import { LightningElement, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';

//import methode that return contentWorkspace list
import getAllContentWorkspace from '@salesforce/apex/LibraryExplorer.getAllContentWorkspace';
//import message chanel
import LibraryMC from '@salesforce/messageChannel/Record_Selected__c';
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
//import methode that return documents
import getWorkspaceDocuments from '@salesforce/apex/LibraryExplorer.getWorkspaceDocuments';
import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
const defaultLibrary = 'Hyundai';
export default class WorkspaceForm extends LightningElement {
    @api selectedLibraryId;
    @api selectedLibraryLabel;
    options = [];
    documents = [];
    
    subscription = null;
    freshData;
    freshWorkspace;
    
    connectedCallback(){
        this.subscribeMC();
        //to refire the event when changing tab
        if(this.selectedLibraryId){
            const searchEvent = new CustomEvent('search',{detail:{LibraryId: this.selectedLibraryId}});
            this.dispatchEvent(searchEvent);
        }
    }
    //wire getAllContentWorkspace method
    @wire(getAllContentWorkspace)
    wiredContentWorkspace(result){
        if(result.data){
            this.freshWorkspace = result;
            //fill combobox with value returned by apex
            let opt = [];
            result.data.forEach((row) => {
                opt.push({
                    label : row.Name,
                    value : row.Id,
                    RootContentFolderId : row.RootContentFolderId
                });
            });
            this.options = opt;
            console.log('options -->',this.options);
            //fill predefined value
            //this.selectedLibraryId = this.options.find(element => element.label === defaultLibrary).value;
            //this.selectedLibraryLabel = defaultLibrary;
            
            this.selectedLibraryId = this.options.find(element => element.label === this.options[0].label).value;
            this.selectedLibraryLabel = this.options[0].label;
            
            const searchEvent = new CustomEvent('search',{detail:{LibraryId: this.selectedLibraryId}});
            this.dispatchEvent(searchEvent);
        }
        else if(result.error){
            //to do if error
            this.options = undefined;
            this.selectedLibraryId = undefined;
        }
    }
    @wire(getWorkspaceDocuments, { workspaceName: '$selectedLibraryId' })
    wiredDocuments(result){
        this.freshData = result;
        if(result.data){
            this.documents = result.data;
            this.sendMessageService(this.documents);
        }else if(result.error){
            console.log(result.error);
        }
    }
    refreshContentDocument(){
        return refreshApex(this.freshData);
    }
    refreshWorkspace(createdLibraryId){
        refreshApex(this.freshWorkspace).then((val) =>{
            this.selectedLibraryId = createdLibraryId;
            this.selectedLibraryLabel = this.options.find(opt => opt.value === this.selectedLibraryId).label;
            console.log('label / id -->',this.selectedLibraryLabel,this.selectedLibraryId);
            const searchEvent = new CustomEvent('search',{detail:{LibraryId: this.selectedLibraryId}});
            this.dispatchEvent(searchEvent);
        });
    }
    // wired message context
    @wire(MessageContext)
    messageContext;

    // Publishes the selected file Id on the recordSelected.
    sendMessageService(docs) { 
        // explicitly pass boatId to the parameter recordId
        publish(this.messageContext, recordSelected, { records : docs , currentLibrary : this.selectedLibraryId , currentLibraryLabel : this.selectedLibraryLabel , numberOfDocuments : docs.length});
        //console.log('this was published from workspace form --> ',docs ,this.selectedLibraryId ,this.selectedLibraryLabel , docs.lenght);

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
    handleMessage(message){
        console.log('get the message --> ',message);
         if(message.refresh){
            this.refreshContentDocument();
        }
        if(message.refreshLibrary && message.createdLibraryId){
            this.refreshWorkspace(message.createdLibraryId);
            publish(this.messageContext, recordSelected, { refreshFolder : true});


        }
    }
    
    // this function must update selectedLibraryId and call search event
    handleLibraryChange(event){
        this.selectedLibraryId = event.detail.value;
        //this.selectedLibraryLabel = event.detail.label;
        this.selectedLibraryLabel = event.target.options.find(opt => opt.value === event.detail.value).label;
        const searchEvent = new CustomEvent('search',{detail:{LibraryId: this.selectedLibraryId}});
        this.dispatchEvent(searchEvent);

        
        
    }
}