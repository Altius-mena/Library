/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 09-14-2020
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 * Modifications Log 
 * Ver   Date         Author                               Modification
 * 1.0   09-14-2020   ChangeMeIn@UserSettingsUnder.SFDoc   Initial Version
**/
@isTest
public class LibraryExplorerTest {
    @testSetup
    static void init(){
        User thisUser = [ select Id from User where Id = :UserInfo.getUserId() ];
        System.runAs ( thisUser ) {
            //creer les bibiotheques
            List<ContentWorkSpace> lib=new List<ContentWorkSpace>();
            lib.add(new ContentWorkSpace(name='hyundaiTest'));
            insert lib;
            //ratacher les bibliotheque aux dossiers
            List<ContentFolderLink> contFolLink=[select id,ParentEntityId,ContentFolderId from ContentFolderLink];
            //creer les dossiers
            List<ContentFolder> fol=new List<ContentFolder>();
            fol.add(new ContentFolder (name='folder1',ParentContentFolderId=contFolLink[0].ContentFolderId));
            insert fol;
            ContentVersion contentVersion = new ContentVersion(
                Title = 'Penguins',
                PathOnClient = 'Penguins.jpg',
                VersionData = Blob.valueOf('Test Content'),
                IsMajorVersion = true
            );
            insert contentVersion;
            List<ContentDocument> cd=[select id,parentId from contentDocument where LatestPublishedVersionId=:contentVersion.id];
            ContentWorkspaceDoc cwDoc=new ContentWorkspaceDoc(ContentDocumentId=cd[0].id,ContentWorkspaceId=lib[0].id);
            insert cwDoc;
            system.debug('content document '+cd);
            ContentFolderMember cfm=new ContentFolderMember(ChildRecordId=cd[0].id,ParentContentFolderId=fol[0].id);
            ContentFolderMember cfmsArchive=[SELECT id,ChildRecordId,ParentContentFolderId FROM ContentFolderMember where ChildRecordId=:cd[0].id limit 1];
            cfmsArchive.ParentContentFolderId=fol[0].id;
            update cfmsArchive;
        }
    }
    @isTest static void getAllFilesTest(){
        //call methode
        list<ContentFolder> response = LibraryExplorer.getAllFiles();
        //verify result
        System.assert(response.size() > 0);
    }
    @isTest static void getAllContentWorkspaceTest(){
        //call methode
        list<ContentWorkspace> response = LibraryExplorer.getAllContentWorkspace();
        //verify result
        System.assert(response.size() > 0);
    }
    @isTest static void getWorkspaceDocumentTest(){
        ContentWorkspace cw = [select id,rootContentFolderId,Name from ContentWorkspace where name='hyundaiTest'];
        ContentDocument cd = [select id,parentId from contentDocument];
        List<ContentFolderMember> response0 = LibraryExplorer.bulkServerMovetoFolder(cd.id,cw.id);
        List<ContentFolderMember> response = LibraryExplorer.getWorkspaceDocuments(cw.id);
        //verify result
        System.assert(response.size() > 0);
        
    }
    @isTest static void bulkServerMovetoFolderTest(){
        List<ContentVersion> contentVersion = [select id from contentVersion];
        List<ContentDocument> cds=[select id,parentId from contentDocument where LatestPublishedVersionId=:contentVersion[0].id Limit 1];
        List<ContentWorkspace> cw = [select id,rootContentFolderId,Name from ContentWorkspace where Id =:cds[0].parentId];
        List<String> listOfId = new List<String>();
        for(ContentDocument cd : cds){
            listOfId.add(cd.Id);
        }
        String docIds = String.join(listOfId,',');
        //get folders
        list<ContentFolder> folders=[SELECT Id,Name,ParentContentFolderId FROM ContentFolder where parentContentFolderId =:cw[0].rootContentFolderId];
        String folderId = (String)folders[0].Id;
        //call methode
        List<ContentFolderMember> response = LibraryExplorer.bulkServerMovetoFolder(docIds,folderId);
        //verify result
        System.assert(response.size() > 0);
    }
    @isTest static void deleteContentDocumentTest(){
        ContentWorkspace cw = [select id,rootContentFolderId,Name from ContentWorkspace where name='hyundaiTest'];        
        ContentDocument cd = [select id,parentId from contentDocument];
        List<ContentFolderMember> response0 = LibraryExplorer.bulkServerMovetoFolder(cd.id,cw.id);
        List<ContentFolderMember> response = LibraryExplorer.getWorkspaceDocuments(cw.id);
        LibraryExplorer.deleteContentDocument(response[0].id);
        Integer sizeAfter = [select id from contentDocument where id = :cw.id].size();
        System.assertEquals(sizeAfter,0);
    }
    @isTest static void createFolderTest(){
        ContentFolder cf = [SELECT id,name from contentFolder limit 1];
        String folderId = LibraryExplorer.createFolder(cf.id,'test');
        System.assertEquals([SELECT id,name from contentFolder where id = :folderId].size(),1);
    }
    @isTest static void deleteFolder(){
        ContentFolder cf = [SELECT id,name from contentFolder limit 1];
        String folderId = LibraryExplorer.createFolder(cf.id,'test');
        System.assertEquals([SELECT id,name from contentFolder where id = :folderId].size(),1);

        String parentId = LibraryExplorer.deleteFolder(folderId);
        System.assertEquals([SELECT id,name from contentFolder where id = :folderId].size(),0);

    }
    @isTest static void createLibraryTest(){
       String libId = LibraryExplorer.createLibrary('test','test');
       List<ContentWorkspace> cw = [select id from ContentWorkspace where id = :libId];        
       System.assertEquals(cw.size(),1);

    }
    @isTest static void deleteLibraryTest(){
        String libId = LibraryExplorer.createLibrary('test','test');
        List<ContentWorkspace> cw = [select id from ContentWorkspace where id = :libId];        
        System.assertEquals(cw.size(),1);
        LibraryExplorer.deleteLibrary(cw[0].id);
        System.assertEquals([select id from ContentWorkspace where id = :libId].size(),0);
     }
    /*@isTest static void editLibraryTest(){
        String libId = LibraryExplorer.createLibrary('test','test');
        ContentWorkspace cw = [select id,description from ContentWorkspace where id = :libId];        
        LibraryExplorer.editLibrary('test1','test1');
        System.assertEquals()
    }*/
    @isTest static void moveFolderTest(){
        List<contentFolder> cf = [SELECT id,name from ContentFolder Limit 2];
        List<ContentFolderLink> contFolLink=[select id,ParentEntityId,ContentFolderId from ContentFolderLink];
        //creer les dossiers
        ContentFolder fol1 = new ContentFolder (name='folder',ParentContentFolderId=contFolLink[0].ContentFolderId);
        insert fol1;
        
        ContentFolder fol2 = new ContentFolder (name='folder2',ParentContentFolderId=contFolLink[0].ContentFolderId);
        insert fol2;
        
        LibraryExplorer.moveFolder(fol2.Id,fol1.Id);
        System.assertEquals([SELECT id,name,parentContentFolderId from ContentFolder where parentContentFolderId = :fol1.id][0].Id,fol2.Id);
        
    }
        
    
}
