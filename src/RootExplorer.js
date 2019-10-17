var RootExplorer = {

	X509BEGIN : "-----BEGIN CERTIFICATE-----\n",
	X509END : "\n-----END CERTIFICATE-----",

	logLists :  {
		"logs_chrome" : {url:"https://www.gstatic.com/ct/log_list/log_list.json", response: null},
		"logs_known" : {url: "https://www.gstatic.com/ct/log_list/all_logs_list.json", response: null},
		//"logs_apple" : {url: "https://valid.apple.com/ct/log_list/current_log_list.json", response: null},
		//"logs_google_new_schema" : {url: "https://www.gstatic.com/ct/log_list/v2_beta/log_list_example.json", response: null}
	},

	SNAPSHOTS : [
		{
			"url": "./root-explorer.2018-12-27.db",
			"description": "Offline, December 27th, 2018"
		},
		{
			"url": "./root-explorer.2019-10-08.db",
			"description": "Offline, October 8th, 2019"
		},
	],
	

	db : new RootExplorerDB(),
	ajaxTimeout: 20000,
	x: new X509(),

	//Fetch roots obtained from the instance of RootExplorerCT into the database.
	fetchRoots: function(listName){
		console.log("Fetching roots into the database");

		if (RootExplorer.logLists[listName].response && RootExplorer.logLists[listName].response.logs){

			for (var logIndex = 0; logIndex < RootExplorer.logLists[listName].response.logs.length; logIndex++){
				var log = RootExplorer.logLists[listName].response.logs[logIndex];

				//Skip non-responding logs
				if (typeof log.roots == 'undefined' || typeof log.roots.certificates == 'undefined' ){
					continue;
				}

				console.log("Fetching roots of " + log.description);

				//Update number of roots for a log presented in a JSON response
				RootExplorer.db.updateLogRootCountJSON(log.fingerprint, log.roots.certificates.length)

				//For each root certificate
				for (rootIndex = 0; rootIndex < log.roots.certificates.length; rootIndex++){
					var rootDER = log.roots.certificates[rootIndex];
					var rootFingerprint = base64sha256(rootDER);

					//Insert root certificate
					RootExplorer.db.insertRootCertificate(rootFingerprint, rootDER);

					//Insert log-root relationship
					RootExplorer.db.insertLogRoot(log.fingerprint, rootFingerprint);

				}
			}
		}

		console.log("Root fetching DONE");
		RootExplorer.view.updateLogList();
		RootExplorer.view.reset();

	},

	//Request intersections of selected logs from the database;
	//Prepare the data for Venn.js
	//Supported intersection depth = 2 or 3
	//TODO general case
	calculateIntersections : function(depth){
		var sets = new Array();

		var intersections = RootExplorer.db.getIntersections(depth);
		switch (depth){
			case 2:

			if (typeof intersections == 'undefined')
			return sets;

			for (var i=0; i < intersections.values.length; i++){
				sets.push({"sets" : (intersections.values[i][0] == intersections.values[i][1] ?
					[intersections.values[i][0]] :
					[intersections.values[i][0], intersections.values[i][1]]
				),
				"size": intersections.values[i][2],
				"label": (intersections.values[i][0] == intersections.values[i][1] ?
					intersections.values[i][3] :
					(intersections.values[i][3] + "<br>∩<br>" + intersections.values[i][4])
				)});
			}

			break;
			case 3:

			if (typeof intersections == 'undefined')
			return sets;

			var label, ids;

			for (var i=0; i < intersections.values.length; i++){
				switch (true){
					case (intersections.values[i][0] == intersections.values[i][1] && intersections.values[i][1] == intersections.values[i][2]):
					label = intersections.values[i][4];
					ids = [intersections.values[i][0]];
					break;
					case (intersections.values[i][0] == intersections.values[i][1] || intersections.values[i][1] == intersections.values[i][2]):
					label = intersections.values[i][4] + "<br>∩<br>" + intersections.values[i][6];
					ids = [intersections.values[i][0], intersections.values[i][2]];
					break;

					default:
					label = intersections.values[i][4] + "<br>∩<br>" + intersections.values[i][5] + "<br>∩<br>" + intersections.values[i][6];
					ids = [intersections.values[i][0], intersections.values[i][1], intersections.values[i][2]];
				}

				sets[label] = ({"sets" : ids,
				"size": intersections.values[i][3],
				"label": label});
			}

		}

		//Prepare data for Venn.js
		var sets_numeric = new Array();

		for (var key in sets){
			if (sets.hasOwnProperty(key)){
				sets_numeric.push( sets[key] );
			}
		}

		return sets_numeric;

	},

	isCompatibleToBrowser : function(){
		return (
			/Chrom/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) ||
			/Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)
			);
	},

	view : {

		chart: venn.VennDiagram().width(600).height(500),

		start : function(){

			if (!RootExplorer.isCompatibleToBrowser()){
				$( "#progress-label" ).text("Only Chrome and Chromium are supported, sorry.");
				$("#testLink").text("(Self-test)")
				$("#main").hide();
				return
			}

			$( "#intersection-depth").selectmenu();

			$( "#tabs" ).tabs();
			$( document ).tooltip();
			$("#venn-approximate-warning").hide();

			$( "#progressbar" ).progressbar({
				value: 0
			});

			var startupDialog = $( "#dialog-confirm" ).dialog({
				dialogClass: "no-close",
				resizable: false,
				width: "80%",
				modal: true,
			});

			//add snapshot buttons to the startup dialog
			var startupDialogButtons = 
				[ 
					{
						text: "Live log scan",
						click: function(){
							$( this ).dialog( "close" );
							RootExplorer.startLiveScan();
						}
					},

					{
						text: "Import a snapshot",
						click: function() {
							$( this ).dialog( "close" );
							$('#dump').on('change', function(e){
								var dump = e.target.files[0];
								if (!dump) {
									return;
								}
								RootExplorer.loadSnapshotAndStart(dump);
							});

							$("#dump").click();

						}
					},
					{
						text: "Self-test",
						click: function() {
							window.location.href = "./test.html?moduleId=3d395d83&moduleId=d8614993&moduleId=2148f2f5"
						}
					}

				]

			RootExplorer.SNAPSHOTS.forEach(function(snapshot){
				startupDialogButtons.push({
						text: snapshot.description,
						click: function() {
							$( this ).dialog( "close" );
							$.ajax({
								xhrFields:{
									responseType: 'blob'
								},
								url: snapshot.url,
								timeout: RootExplorer.ajaxTimeout,
								success: function(response, textStatus, jqXHR ){
									RootExplorer.loadSnapshotAndStart(response);
								}
							}).always(function() { })
							.fail(function( ) {
								alert("Failed to load a snapshot.")
								location.reload()
							});
						}
					});
			});

			startupDialog.dialog("option", "buttons", startupDialogButtons); 

			$(document).keypress(RootExplorer.view.vennShuffleLayers);
			$("#intersection-depth").on('selectmenuchange', RootExplorer.view.reset);
			document.addEventListener('venn_approximate', function (e) {
				$("#venn-approximate-warning").show();
			});

		},

		updateLogList : function() {

			//clear the list
			$("#logs_chrome .ok, .unavailable, .disqualified, .other").text("");

			var logs = RootExplorer.db.listLogs();

			for (var key in logs) {

				if (!logs.hasOwnProperty(key)) {
					continue;
				}
				var log = logs[key];

				var subcategory = "ok";
				var disabledString = "";
				var disqualifiedString = "";
				var chromeTrustedString = "";

				if (log.disqualified_at > 0){
					disqualifiedString = "disqualified";
				} else if (log.chrome_trusted){
					chromeTrustedString = "chromeTrusted";
				}

				if (log.root_count_json == null) {
					subcategory = "unavailable";
					disabledString = "disabled";
				}

				if (log.key == null){
					subcategory = "other";
				}

				$("#logs ." + subcategory).append(
					'<div class="' + [disqualifiedString, chromeTrustedString].join(" ") + '">' +
					'<input type="checkbox" id="' + log.fingerprint + '" ' + disabledString + " " +
					'onclick="RootExplorer.view.logToggle(this)" '+
					'name="' + log.fingerprint + '" ' + (log.checked == true ? "checked" : "") +' >' +
					'<label for="'+ log.fingerprint +'" title="' + Array(log.url, disqualifiedString, chromeTrustedString).join(' ') +'">'+ log.description +
					' <a target="_blank" title="Number of certificates in JSON response" href="https://' + log.url +
					'ct/v1/get-roots">[' + log.root_count_json + ']</a> '+
					(log.root_count_distinct != log.root_count_json && log.root_count_json ? ( ' (' + log.root_count_distinct + ' distinct)' ) : '') +
					'</label></div>'
				);
			}

			$( "#progress-label" ).text("Logs and root-stores: " + RootExplorer.db.logsOnline() + " Unique roots: " + RootExplorer.db.rootCount());
			$("#dumpDatabaseButton").show();
		},

		//Toggle log in the Database and reset the view
		logToggle : function(logDOM){
			RootExplorer.db.logSetChecked(logDOM.name, +$(logDOM).is(":checked"));
			RootExplorer.view.reset();
		},

		/* Reset necessary elements on update */
		reset : function(){

			$("#venn-approximate-warning").hide();
			console.log("Resetting the explorer");

			var sets = RootExplorer.calculateIntersections(parseInt($('#intersection-depth').find(":selected").text()));
			RootExplorer.view.initVenn(sets);

			$( "#progressbar" ).progressbar({
				value: 100
			});
			$('#tabs').tabs("option", "active", 0);
			$('#complement, .complement').hide();
			$('#intersection, .intersection').hide();
		},

		exploreSubsetOfRoots : function(d, i){

			$('#intersection, .intersection').show();
			RootExplorer.view.prepareDataTable('intersection', d);

			if ( d.sets.length > 1 ){
				RootExplorer.view.prepareDataTable('complement', d);
				$('#complement, .complement').show();
			} else {
				$('#complement, .complement').hide();
			}

			$('#tabs').tabs("option", "active", 1);
			$('.x509').trigger("click");

		},

		exploreRootFrequency : function(d, i){
			d.sets = [];
			d.label = 'Certificates with frequency ' + d.rank;
			RootExplorer.view.prepareDataTable('rank', d);

			$('#complement, .complement').show();
			$('#intersection, .intersection').hide();

			$('#tabs').tabs("option", "active", 1);
			$('.x509').trigger("click");
		},

		exploreUnion : function(){
			var d = {sets : []}
			d.label = 'Union of selected logs/stores';

			RootExplorer.view.prepareDataTable('union', d);

			$('#complement, .complement').hide();
			$('#intersection, .intersection').show();

			$('.x509').trigger("click");
		},

		//tableName values: 'intersection' - main DataTable, 'complement' - secondary DataTable
		//d.sets[] - fingerprints of logs
		//d.label - table caption
		//d.rank - number of logs/stores
		prepareDataTable : function(tableName, d){
			var logs = d.sets;

			var mask = "";
			for (var i=0; i<logs.length; i++){
				mask += ('?' + (i < logs.length - 1 ? ',' : ''))
			}

			var params = logs.slice(0);
			params.push(logs.length);

			var stmt

			switch (tableName){
				case 'intersection':
				stmt = RootExplorer.db.getIntersectionsStatement(mask, params)
				break;
				case 'complement':
				stmt = RootExplorer.db.getComplementStatement(mask, params)
				break;
				case 'rank':
				stmt = RootExplorer.db.getFrequencyStatement(d.rank)
				break;
				case 'union':
				stmt = RootExplorer.db.getUnionStatement()

			}
			var data = [];

			while (stmt.step()) {
				var root = stmt.getAsObject();
				RootExplorer.x.readCertPEM(RootExplorer.X509BEGIN + root.der + RootExplorer.X509END);
				root.x509Version = "v" + RootExplorer.x.version;
				root.subject = RootExplorer.x.getSubjectString();
				root.issuer = RootExplorer.x.getIssuerString();
				if (root.issuer == root.subject){
					root.issuer = "";
				}
				//TODO: parse UTCTime with exceptions
				root.notBefore = RootExplorer.x.getNotBefore();//.substr(0,6).replace(/(..)(..)(..)/,"$1-$2-$3");
				root.notAfter = RootExplorer.x.getNotAfter();//.substr(0,6).replace(/(..)(..)(..)/,"$1-$2-$3");
				root.info = RootExplorer.x.getInfo();
				root.signatureAlgorithm = RootExplorer.x.getSignatureAlgorithmName();
				root.fingerprint = "<a target='_blank' class='fingerprint' href='https://crt.sh/?sha256=" + root.fingerprint + "'>" + root.fingerprint + "</a>";
				data.push(root);
			}

			var clmns = [
				{ data: 'subject' },
				{ data: 'issuer' },
				{ data: 'notBefore' },
				{ data: 'notAfter' },
				{ data: 'x509Version' },
				{ data: 'signatureAlgorithm' },
				{ data: 'fingerprint'}
			];

			var label = d.label.replace(/<br>/g," ");
			switch (tableName){
				case 'complement':
				clmns.push({ data: 'logs' });
				label = '('+ label +')ᶜ'
				break;
				case 'rank':
				clmns.push({ data: 'logs' });
				tableName = 'complement'
				label += ' [' + RootExplorer.db.getSelectedLogDescriptions(', ') +']';
				break;
				case 'union':
				tableName = 'intersection' //TODO: looks ambiguous
				label = RootExplorer.db.getSelectedLogDescriptions(' ∪ ')
				break;
			}

			var table = $('#' + tableName + ' table')
			table.filter('caption').remove();
			table.prepend('<caption>' + label + '</caption>');

			table.DataTable( {
				data: data,
				autoWidth: false,
				destroy: true,
				"scrollX": true,
				dom: 'B<"clear">lfrtip',
				buttons: [
					'copy' ,'csv', 'excel', 'print'
				],
				columns: clmns,
				caption: label
			} );

			//set table caption and the header
			$('h3.'+tableName).text(label);

		},

		initVenn : function(sets){

			var div = d3.select("#venn")
			div.datum(sets).call(RootExplorer.view.chart);

			var tooltip = d3.select("#venntooltip");

			div.selectAll("path")
			.style("stroke-opacity", 0)
			.style("stroke", "#000")
			.style("stroke-width", 3)

			div.selectAll("g")
			.on("mouseover", function(d, i) {

				// Display a tooltip with the current size
				tooltip.transition().duration(400).style("opacity", .9).style("display","block");

				tooltip.html("<b>" + d.size + " roots</b><br>" + d.label);

				// highlight the current path
				var selection = d3.select(this).transition("tooltip").duration(400);
				selection.select("path")
				.style("fill-opacity", d.sets.length == 1 ? .4 : .1)
				.style("stroke-opacity", 1);
				$(d.sets).hide();
			})
			.on("click", RootExplorer.view.exploreSubsetOfRoots)

			.on("mousemove", function() {
				tooltip.style("left", (d3.event.pageX + 50) + "px")
				.style("top", (d3.event.pageY - 100) + "px");
			})

			.on("mouseout", function(d, i) {
				tooltip.transition().duration(400).style("opacity", 0).style("display","none");
				var selection = d3.select(this).transition("tooltip").duration(400);
				selection.select("path")
				.style("fill-opacity", d.sets.length == 1 ? .25 : .0)
				.style("stroke-opacity", 0);
			});
		},

		plotRootFrequencyDistribution : function(){

			var stmt = RootExplorer.db.getFrequencyDistributionStatement();
			var data = [];

			while (stmt.step()) {
				var frequency = stmt.getAsObject();
				data.push(frequency);
			}

			d3.select("#root-frequencies").selectAll("svg").remove()
			var margin = {top: 20, right: 20, bottom: 40, left: 40},
			width = 600 - margin.left - margin.right,
			height = 400 - margin.top - margin.bottom;

			var y = d3.scaleBand()
			.range([height, 0])
			.padding(0.1);

			var x = d3.scaleLinear()
			.range([0, width]);

			var svg = d3.select("#root-frequencies").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

			x.domain([0, d3.max(data, function(d){ return d.roots; })])
			y.domain(data.map(function(d) { return d.rankx; }));

			svg.selectAll(".bar")
			.data(data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("width", function(d) {return x(d.roots); } )
			.attr("y", function(d) { return y(d.rankx); })
			.attr("height", y.bandwidth())
			.on('click', RootExplorer.view.exploreRootFrequency);

			svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));

			svg.append("g")
			.call(d3.axisLeft(y));

			svg.append("text")
			.attr("transform",
			"translate(" + (width/2) + " ," +
			(height + margin.top + 15) + ")")
			.style("text-anchor", "middle")
			.text("Number of certificates");

			svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Frequency");

		},

		vennShuffleLayers : function(){
			var parent = $("#venn svg");
			var divs = parent.children();
			while (divs.length) {
				parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
			}
		}
	},


	parseLog : function(log) {
		log.fingerprint = base64sha256(log.key);
		log.log_list = this.toString();

		//insert log
		RootExplorer.db.insertLog(log);

		//update if disqualified
		if (log.disqualified_at){
			RootExplorer.db.logSetDisqualifiedAt(log.fingerprint, log.disqualified_at);
		}

		//insert log into a list
		RootExplorer.db.insertLogList(log.fingerprint, this.toString());

		RootExplorer.ct.requestRoots(log);
	},

	startLiveScan : function(){

		$( "#progressbar" ).progressbar({
			value: false
		});

		$( "#progress-label" ).text("Loading Certificate Transparency Logs and their roots...");

		RootExplorer.ct.requestLogsFromList("logs_chrome")
		RootExplorer.ct.requestLogsFromList("logs_known")

		setTimeout(RootExplorer.fetchRoots, RootExplorer.ajaxTimeout + 5000, "logs_known");

	},

	dumpDatabase : function() {
		var blob = new Blob([RootExplorer.db.export()], {type: "application/octet-stream"}),
		url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'root-explorer.'+$.datepicker.formatDate('yy-mm-dd', new Date())+'.db';
		a.click();
		window.URL.revokeObjectURL(url);
	},

	startExplorerOffline : function(snapshot){
		$( "#progressbar" ).progressbar({
			value: false
		});

		$( "#progress-label" ).text("Loading a snapshot of logs and roots...");

		RootExplorer.db.importSnapshot(snapshot)

		try {
			RootExplorer.view.updateLogList()
		} catch {
			alert("Failed to load a snapshot. Only CT-Root-Explorer dumps are supported.")
			location.reload()
		}

		RootExplorer.view.reset()
		$( "#progress-label" ).prepend("[DUMP]")
		console.log("Offline mode STARTED")

	},

	loadSnapshotAndStart : function(snapshot){
		console.log("Loading an offline snapshot.");
		var reader = new FileReader();
		reader.onload = function(e) {
			RootExplorer.startExplorerOffline(new Uint8Array(e.target.result));
		};
		reader.readAsArrayBuffer(snapshot);
	},


	ct : {
		requestRoots: function(log) {
			$.ajax({
				dataType: "json",
				url: "https://" + log.url + "ct/v1/get-roots",
				timeout: RootExplorer.ajaxTimeout,
				success: function(response, textStatus, jqXHR ){
					log.roots = response;
					console.log("Got " + log.roots.certificates.length + " roots for " + log.description);
				}
			}).always(function() { })
			.fail(function( ) {
				console.log("Failed to get-roots of " + log.description + " https://" + log.url + "ct/v1/get-roots ")
			});
		},

		requestLogsFromList: function(listName){
			$.getJSON(RootExplorer.logLists[listName].url, function(response){
				var normalizedResponse = RootExplorer.ct.normalizeLogListResponse(response);
				if (!normalizedResponse) {
					alert("Failed to get logs from a Google's list (Incompatible schema)");
				}
				RootExplorer.logLists[listName].response = normalizedResponse
				RootExplorer.logLists[listName].response.logs.forEach(RootExplorer.parseLog, listName);
			})
			.fail(function() { alert('Failed to fetch ' + listName); })
			.always(function() {  });
		},

		/* When Google's log schema v2.0 comes,
		we have to automatically convert the new list into the legacy one */
		normalizeLogListResponse: function(response){

			if (response.logs){
				return response
			}

			normalizedResponse = {logs : []};

			if (!response.operators){
				return normalizedResponse
			}

			for (operatorIndex = 0; operatorIndex < response.operators.length; operatorIndex++){
				operator = response.operators[operatorIndex];
				for (logIndex = 0; logIndex < operator.logs.length; logIndex++){
					log = operator.logs[logIndex];
					normalizedLog = {
						description: log.description,
						key : log.key,
						url : log.url.replace(/^(https?:|)\/\//,''),
						maximum_merge_delay : log.mmd
					}
					normalizedResponse.logs.push(normalizedLog)
				}
			}
			return normalizedResponse
		}

	}

}
