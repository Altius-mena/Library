({
    getDoc : function(folder,cmp) {
        var action = cmp.get("c.getContentDocuments");
        action.setParams({ folderId : folder });
        action.setCallback(this, function(response) {
            var state = response.getState();

            if (state === "SUCCESS") {
                var parsed = response.getReturnValue();
                cmp.set("v.filesIdGlobal", parsed);
                cmp.set("v.filesId", parsed);
            }
            else if (state === "INCOMPLETE") {
                // do something
            }
            else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + 
                                errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    }
})