class RootExplorerCT{

  constructor(){
    this.logLists = {
      "logs_chrome" : {url:"https://www.gstatic.com/ct/log_list/log_list.json", response: null},
		  "logs_known" : {url: "https://www.gstatic.com/ct/log_list/all_logs_list.json", response: null}
		};
  }

  logList(name){
    return this.logLists[name]
  }

  requestRoots(log) {
		$.ajax({
			dataType: "json",
			url: "https://" + log.url + "ct/v1/get-roots",
			timeout: ajaxTimeout,
			success: function(response, textStatus, jqXHR ){
				log.roots = response;
				console.log("Got " + log.roots.certificates.length + " roots for " + log.description);
			}
		}).always(function() { })
		.fail(function( ) {
			console.log("Failed to get-roots of " + log.description + " https://" + log.url + "ct/v1/get-roots. ")
		});
	}

  requestLogsFromList(listName, callback){

		$.getJSON(this.ct.logList(listName).url, function(response){
			this.logLists[listName].response = response;
			this.logLists[listName].response.logs.forEach(callback, listName);
		})
		.fail(function() { alert('Failed to fetch ' + listName); location.reload() })
		.always(function() {  });
	}
}
