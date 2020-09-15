import { LightningElement, wire, api } from 'lwc';
// Import message service features required for publishing and the message channel
import { publish,subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import recordSelected from '@salesforce/messageChannel/Record_Selected__c';
import { NavigationMixin } from 'lightning/navigation';
import deleteContentDocument from '@salesforce/apex/LibraryExplorer.deleteContentDocument';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const actions = [
    { label: 'Show details', name: 'viewRecord' },
    { label: 'Download', name: 'download' },
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

const columns = [
    {
        label: 'Title',
        fieldName: 'Title', 
        type: 'text', 
        initialWidth: 400,
        cellAttributes: { iconName: { fieldName: 'Icon' },iconPosition: 'left' },
        sortable: true    
    },
    {
        label: 'Size', 
        fieldName: 'ContentSize', 
        type: 'number',
        typeAttributes: { label: 'Ko'},
        sortable: true
    },
    {
        label: 'Type', 
        fieldName: 'FileType', 
        type: 'text', 
        sortable: true
    },
    {
        label: 'Created date', 
        fieldName: 'CreatedDate', 
        type: 'date', 
        sortable: true
    },
    {
        label: 'Created by', 
        fieldName: 'CreatedByName', 
        type: 'text', 
        sortable: true
    },
    {
        label: 'Last modified date', 
        fieldName: 'LastModifiedDate', 
        type: 'date', 
        sortable: true
    },
    {
        label: 'Last modified by', 
        fieldName: 'LastModifiedByName', 
        type: 'text', 
        sortable: true
    },
    {
        label: 'Actions',
        type: 'action',
        typeAttributes: { rowActions: actions },
    } 
    
    
];
export default class FileTable extends NavigationMixin(LightningElement) {
    columns = columns;
    

    @wire(MessageContext)
    messageContext;

    subscription = null;
    data;
    @api childAttr;
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

    handleMessage(message) {
        let rec = message.records;
        if(rec){
            let currentData = [];
            rec.forEach((row) => {
                let rowData = {};
                rowData.Id = row.ChildRecord.Id;
                rowData.Title = row.ChildRecord.Title;
                rowData.Icon = this.getIcon(row.ChildRecord.FileExtension);
                rowData.ContentSize = row.ChildRecord.ContentSize;
                rowData.FileType = row.ChildRecord.FileType;
                rowData.CreatedDate = row.CreatedDate;
                rowData.CreatedByName = row.CreatedBy.Name;
                rowData.LastModifiedDate = row.LastModifiedDate;
                rowData.LastModifiedByName = row.LastModifiedBy.Name;
                currentData.push(rowData);
            });
            this.data = currentData;
        }   

    }
    getIcon(type){
        if(type=='jpeg' || type=='png' || type=='gif' || type=='jpg' ){
            return 'doctype:image';
        }
        else if(type=='xlsx' || type=='xls'){
            return 'doctype:excel';
        }
        else{
            return 'doctype:'+type;
        }
    }
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
        case 'edit':
            this.editRecord(row);
            break;
        case 'view':
            this.viewRecord(row);
            break;
        case 'delete':
            this.deleteRecord(row);
            break;
        case 'download':
            this.download(row);
            break;
        
        default:
        this.viewRecord(row);
        break;
        }
    }
    viewRecord(row) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: row.Id,
                actionName: 'view',
            },
        });
    }
    deleteRecord(row){
        deleteContentDocument({contentDocumentId: row.Id})
            .then(result => {
                this.showSuccessToast('Success','The record was successfully deleted','success');
                this.sendMessageServiceToRefresh();
            })
            .catch(error => {
                this.showErrorToast('Error','Error contact your admin','error');
            });
    }
    download(row){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: "/sfc/servlet.shepherd/document/download/"+row.Id+"?operationContext=S1"
            }
        },
        false // Replaces the current page in your browser history with the URL
      );
    
        
    }
    findRowIndexById(id) {
        let ret = -1;
        this.data.some((row, index) => {
            if (row.id === id) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }
    editRecord(row) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: row.Id,
                actionName: 'edit',
            },
        });
    }
    showSuccessToast(success_title,message,success_variant){
        this.dispatchEvent(
            new ShowToastEvent({
                title: success_title,
                message: message,
                variant: success_variant
            })
        );
    }
    showErrorToast(error_title,message,error_variant){
        this.dispatchEvent(
            new ShowToastEvent({
                title: error_title,
                message: message,
                variant: error_variant
            })
        );
    }
    // Publishes the refreh.
    sendMessageServiceToRefresh() { 
        publish(this.messageContext, recordSelected, { refresh : true});
        
    }
    handleSortdata(event) {
        // field name
        this.sortBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.data));

        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };

        // cheking reverse direction 
        let isReverse = direction === 'asc' ? 1: -1;

        // sorting data 
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.data = parseData;

    }

}