/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 09-14-2020
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 * Modifications Log 
 * Ver   Date         Author                               Modification
 * 1.0   07-30-2020   ChangeMeIn@UserSettingsUnder.SFDoc   Initial Version
**/
public with sharing class LibraryExplorer {
    @AuraEnabled(cacheable=true)
    public static list<ContentWorkspace> getAllContentWorkspace(){
         return [SELECT Id,Name,RootContentFolderId FROM ContentWorkspace WHERE WorkspaceType !='B'];
    }
    @AuraEnabled(cacheable=true)
    public static list<ContentFolder> getAllFiles(){
        return [SELECT Id,Name,ParentContentFolderId FROM ContentFolder order BY Name];
    }
    @AuraEnabled(cacheable=true)
    public static List<ContentFolderMember> getContentDocuments(String folderId){
        return [SELECT Id,ChildRecordId,ChildRecord.Title,ChildRecord.FileType,ChildRecord.ContentSize,ChildRecord.FileExtension,CreatedDate,CreatedById,CreatedBy.Name,LastModifiedDate,LastModifiedById,LastModifiedBy.Name FROM ContentFolderMember WHERE ParentContentFolderId =:folderId];
    }
    @AuraEnabled(cacheable=true)
    public static List<ContentFolderMember> getWorkspaceDocuments(String workspaceName){
        ContentFolder cf = [SELECT id,name FROM contentFolder WHERE name =:workspaceName Limit 1];
        return [SELECT Id,ChildRecordId,ChildRecord.Title,ChildRecord.FileType,ChildRecord.ContentSize,ChildRecord.FileExtension,CreatedDate,CreatedById,CreatedBy.Name,LastModifiedDate,LastModifiedById,LastModifiedBy.Name FROM ContentFolderMember where parentContentFolderId = :cf.id];
    }
    @AuraEnabled
    public static List<ContentFolderMember> bulkServerMovetoFolder(String docIds,String folderId) {
        try{
            docIds = docIds.replaceAll('\\s+','');
            List<String> ids = docIds.split(',');
            
            
            List<ContentFolderMember> folderMembers = [SELECT Id, ParentContentFolderId,ChildRecordId 
                                                FROM ContentFolderMember WHERE ChildRecordId IN :ids];
            ID w = (ID)folderId;
            Schema.SObjectType expected = Schema.ContentWorkspace.getSObjectType();
            ContentFolder folder;
            if(w.getsobjecttype() == expected){
                    folder = [SELECT id,name from contentFolder where name = :folderId limit 1];
            }else{
                    folder = [SELECT Id, name from contentfolder where id = :folderId limit 1];        
            }        
            
            List<ContentFolderMember> contentFolderMembers = new List<ContentFolderMember>();
            for(ContentFolderMember fm : folderMembers){
                fm.ParentContentFolderId = folder.Id;
                contentFolderMembers.Add(fm);
            }
            update contentFolderMembers;
            //System.debug(contentFolderMembers);
            return getContentDocuments(folderId);
        }catch(Exception ex){
            throw new AuraHandledException(ex.getMessage()); 
        }

    }
    @AuraEnabled
    public static void deleteContentDocument(String contentDocumentId){
        Delete [Select id from ContentDocument where  id=:contentDocumentId];
    }
    @AuraEnabled
    public static String createFolder(String contentFolderId,String name){
        ID w = (ID)contentFolderId;
            Schema.SObjectType expected = Schema.ContentWorkspace.getSObjectType();
            ContentFolder folder = new ContentFolder();
            if(w.getsobjecttype() == expected){
                    ContentFolder f = [SELECT id,name from contentFolder where name = :contentFolderId limit 1];
                    folder.Name = name;
                    folder.ParentContentFolderId = f.Id;    
                    insert folder;
            }else{
                    folder.Name = name;
                    folder.ParentContentFolderId = w;    
                    insert folder;        
            }
            return folder.Id;
    }
    @AuraEnabled
    public static string deleteFolder(String contentFolderId){
        ContentFolder f = [SELECT Id,ParentContentFolderId from ContentFolder where Id = :contentFolderId];
        String parent = f.ParentContentFolderId;
        delete f;
        return parent;
    }
    @AuraEnabled
    public static void moveFolder(String source,String target){
        ContentFolder f = [SELECT Id,ParentContentFolderId from ContentFolder where Id = :source];
        f.ParentContentFolderId = target;
        update f;
    }
    @AuraEnabled
    public static String createLibrary(String name,String description){
        ContentWorkspace c = new ContentWorkspace ();
        c.name=name;
        c.description = description;
        Insert c;
        return c.Id;
    }
    @AuraEnabled
    public static void deleteLibrary(String LibraryId){
        delete [SELECT Id,Name FROM ContentWorkSpace WHERE id = :LibraryId];
    }
    @AuraEnabled
    public static void editLibrary(String name,String description){
        /*ContentWorkspace c = new ContentWorkspace ();
        c.name=name;
        c.description = description;
        update c;*/
    }
}
