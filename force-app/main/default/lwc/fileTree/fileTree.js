import { LightningElement, wire, api, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';

// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';

import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
//import methode that return file list
import getAllFiles from '@salesforce/apex/LibraryExplorer.getAllFiles';
//import methode that return documents
import getContentDocuments from '@salesforce/apex/LibraryExplorer.getContentDocuments';

export default class FileTree extends LightningElement {
    // private
    subscription = null;
    freshData;
    freshFolderData;
    globalItems = [];
    globalSortedItems = [];
    @track items = [];
    notSortedData = [];
    documents = [];
    selectedLibraryId;
    selectedLibraryLabel;
    isLoading = true;
    foundNode = {};
    finalItems = [];
    

    @api selectedFolderId;
    @wire(getAllFiles)
    wiredFiles(result){
        this.freshFolderData = result;
        if(result.data){
            let currentData = [];
            var i = 0;
            result.data.forEach((row) => {
                let rowData = {};
                if(row.ParentContentFolderId === undefined){
                    rowData.ParentFolderId = '';
                }else{
                    rowData.ParentFolderId = row.ParentContentFolderId;
                }
                rowData.label = row.Name;
                rowData.name = row.Id;
                rowData.disabled = false;
                rowData.expanded = false;
                rowData.items = [];
                currentData.push(rowData);
            });
            this.items = currentData;
            this.sortAsTree(this.items);
            //this.sortAsTree(currentData);
            this.isLoading = false;
            
            
        }else if(result.error){
            console.log(result.error);
        }
    }
    @wire(getContentDocuments, { folderId: '$selectedFolderId' })
    wiredDocuments(result){
        this.freshData = result;
        if(result.data){
            this.documents = result.data;
            this.sendMessageService(this.documents);
            this.sendMessageServiceForCurrentFolderId(this.selectedFolderId);
        }else if(result.error){
            console.log(result.error);
        }
    }
    refreshContentDocument(){
        return refreshApex(this.freshData);
    }
    refreshFolder(){
        refreshApex(this.freshFolderData).then((val) =>{
            const tab =this.globalItems.find(element => element.label == this.selectedLibraryId);
            this.items=[];
            this.items = tab['items'];
            this.globalSortedItems = this.items;
            this.expandFolderById(this.selectedFolderId);
            this.sendMessageServiceForCurrentFolderId(this.selectedFolderId);
        }     
        );
    }
    connectedCallback(){
        this.subscribeMC();   
    }
    renderedCallback(){
        this.modifyCss();
    }
    handleOnselect(event){
           
        this.selectedFolderId = event.detail.name;
        this.expandFolderById(this.selectedFolderId);
        this.sendMessageServiceForCurrentFolderId(this.selectedFolderId);
        this.sendMessageServiceFileTree(this.notSortedData,this.selectedFolderId);
        
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
    fileSearch(event){
        this.selectedLibraryId = event.detail.LibraryId;
        const tab =this.globalItems.find(element => element.label == this.selectedLibraryId);
        this.items=[];
        this.items = tab['items'];
        this.globalSortedItems = this.items;
        this.sendMessageServiceForCurrentFolderId(this.selectedFolderId);
    }
    folderSearch(){

    }
    sortAsTree(list){
        this.notSortedData = list;
        var map = {}, node, roots = [], i;
            for (i = 0; i < list.length; i += 1) {
                map[list[i].name] = i; // initialize the map
                list[i].items = []; // initialize the children
            }
            var ind = 0;
            for (i = 0; i < list.length; i += 1) {
                node = list[i];
                if (node.ParentFolderId !== '') {
                    list[map[node.ParentFolderId]].items.push(node);
                } else {
                    node.indice=roots.length;
                    roots.push(node);
                }
            }
        
        this.mark(roots,'');
        this.globalItems = roots;

    }
    map={}
    mark(arr,parentIndice ){
        for (var i=0;i<arr.length;i++){
           if('indice' in arr[i]){
               this.mark(arr[i].items,arr[i].indice);
           }else{
               arr[i].indice=parentIndice+'.'+i.toString(); 

               this.mark(arr[i].items,arr[i].indice);
           }
           this.map[arr[i].name] = arr[i].indice;
        }
    }
    // wired message context
    @wire(MessageContext)
    messageContext;
    // Publishes the fileTree on the recordSelected.
    sendMessageServiceFileTree(items,folder) { 
        publish(this.messageContext, recordSelected, { tree : items ,folderId : folder });
    }
    // Publishes the selected file Id on the recordSelected.
    sendMessageService(docs) { 
        // explicitly pass fileId to the parameter recordId
        publish(this.messageContext, recordSelected, { records : docs });
    }
     // Publishes the selected folder Id on the recordSelected.
     sendMessageServiceForCurrentFolderId(folderId) { 
        // explicitly pass folderId to the parameter recordId
        publish(this.messageContext, recordSelected, { currentFolderId : folderId ,currentLibraryId : this.selectedLibraryId ,numberOfDocuments : this.documents.length});
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
        if(message.key){
            const key = message.key.toLowerCase();
            let documentAfterSearch = [];
            documentAfterSearch = this.documents.filter(x => x['ChildRecord']['Title'].toLowerCase().search(key) != -1);
            this.sendMessageService(documentAfterSearch);
        }
        else if(message.key === ''){
            this.sendMessageService(this.documents);
        }
        else if(message.keyFolder){
                const keyFolder = message.keyFolder.toLowerCase();
                let folderAfterSearch = [];
                //this.items = this.globalSortedItems.filter(x => x['label'].toLowerCase().search(keyFolder) != -1);
                this.createMiniTree(keyFolder,this.globalItems);
                
                
            }
        else if(!message.keyFolder){
            this.items = this.globalSortedItems;    
        }    
        if(message.refresh){
            this.refreshContentDocument();
        }
        if(message.refreshFolder){
            this.selectedFolderId = message.createdFolderId;
            this.refreshFolder();
            
        }
        if(message.getItems){
            publish(this.messageContext, recordSelected, { sortedTree : this.items, map : this.map, currentLibraryLabel : this.selectedLibraryLabel, sourceFolderId : this.selectedFolderId});
        }
        
        
    }
    createMiniTree(keyFolder,list,event){
        console.log('create mini tree');
        //const key = event.detail.value;
        console.log('key --> ',keyFolder);
        var finalItems = [];
        var ids = this.getIdsFromKey(this.globalItems,keyFolder);
        console.log('ids --> ',ids);
        for( let i=0;i<ids.length;i++ ){
            console.log(this.getNodeFromId(this.globalItems,ids[i],finalItems));
        }
            //this.items = this.getNodeFromId(this.globalItems,ids[i],finalItems);

    }
    getIdsFromKey(list,key){
        const jsonList = JSON.parse(JSON.stringify(list));
        console.log('getIdFromKey  ',jsonList,key);
        key = key.toLowerCase();
        const foundId = jsonList.filter(element => element.label.toLowerCase().includes(key));
        return foundId;
      }
    getNodeFromId(list,id,finalItems){
        console.log('getNodeFromId');
      if(foundNode.ParentFolderId === ""){
        console.log(finalItems)
      return finalItems;
      }
        else{
            foundNode = list.find(element => element.name === id);
          finalItems.push(foundNode);
          this.getNodeFromId(list,foundNode.ParentFolderId,finalItems);
        }
      }
    modifyCss(){
        const treeElement = this.template.querySelector("lightning-tree");
        let style = document.createElement("style");
        style.innerHTML = ".slds-tree__item-label::before {  display:inline-block;width:10%;margin:0 6px 0 0;vertical-align: middle; content: url(\"data:image/svg+xml,%3Csvg fill='%23000000' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24px' height='24px'%3E%3Cpath d='M 0 1 L 0 22 L 24 22 L 24 4 L 9 4 L 7.21875 1 Z M 2 6 L 22 6 L 22 20 L 2 20 Z'/%3E%3C/svg%3E\");    } .fileTree .slds-card {height : 50em;overflow : scroll;} .cFileDisplayer{height : 50em;overflow : scroll;} .cFileDisplayer .slds-card__body {margin-top : 0px;} .cFileDisplayer .slds-card__header {display: none;} .slds-card{background: #F4F6F9;}";
        treeElement.appendChild(style);
    }
}