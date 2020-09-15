({
    handleChanged: function(cmp, message) {
            // Read the message argument to get the values in the message payload
            
        if (message != null && message.getParam("records") != null) {
            const documents = message.getParam("records");
            cmp.set("v.filesIdGlobal", documents);
            cmp.set("v.filesId", documents);
            cmp.set("v.spinner", false);
        }
        if (message != null && message.getParam("gallery") != null && message.getParam("table") != null) {
            const gallery = message.getParam("gallery");
            const table = message.getParam("table");
            cmp.set("v.isGallery", gallery);
            cmp.set("v.isTable", table);
            if(gallery === true){
                var element1 = document.getElementsByClassName('gallery').style.display = 'none';
                var element2 = document.getElementsByClassName('gallery').style.display = 'block';
            }else{
                var element3 = document.getElementsByClassName('gallery').style.display = 'none';
                var element4 = document.getElementsByClassName('table').style.display = 'block';
            }

        }
    },
    
})