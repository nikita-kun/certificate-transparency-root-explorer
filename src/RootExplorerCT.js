class RootExplorerCT{

  constructor(){
    this.logLists = {
      "logs_chrome" : {url:"https://www.gstatic.com/ct/log_list/log_list.json", response: null},
		  "logs_known" : {url: "https://www.gstatic.com/ct/log_list/all_logs_list.json", response: null}
		};
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
}
