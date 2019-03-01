class RootExplorer{

	const X509BEGIN = "-----BEGIN CERTIFICATE-----\n"
	const X509END = "\n-----END CERTIFICATE-----"

	const DEFAULT_SNAPSHOT_URL = "./root-explorer.2018-12-27.db"
	const DEFAULT_SNAPSHOT_DESCRIPTION = "Offline snapshot from December 27th, 2018"

	constructor(){
		this.ajaxTimeout = 10000;

		//Create the database
		this.db = new RootExplorerDB();
		this.x = new X509();

		this.logLists = { "logs_chrome" : {url:"https://www.gstatic.com/ct/log_list/log_list.json", response: null},
		"logs_known" : {url: "https://www.gstatic.com/ct/log_list/all_logs_list.json", response: null}
		};
	}



	requestRoots(item) {
		$.ajax({
			dataType: "json",
			url: "https://" + item.url + "ct/v1/get-roots",
			timeout: ajaxTimeout,
			success: function(response, textStatus, jqXHR ){
				item.roots = response;
				console.log("Got " + item.roots.certificates.length + " roots for " + item.description);

			}
		}).always(function() { })
		.fail(function( ) {
			console.log("Failed to get-roots of " + item.description + " https://" + item.url + "ct/v1/get-roots. ")
		});

	}

	fetchRoots(listName){
		console.log("Fetching roots into the database");

		for (logIndex = 0; logIndex < logLists[listName].response.logs.length; logIndex++){
			var logObj = logLists[listName].response.logs[logIndex];

			//Skip non-responding logs
			if (typeof logObj.roots == 'undefined' || typeof logObj.roots.certificates == 'undefined' ){
				continue;
			}

			console.log("Fetching roots of " + logObj.description);

			//Update number of roots for a log presented in a JSON response
			this.db.updateLogRootCountJSON(logObj.fingerprint, logObj.roots.certificates.length)

			//For each root certificate
			for (rootIndex = 0; rootIndex < logObj.roots.certificates.length; rootIndex++){
				var rootDER = logObj.roots.certificates[rootIndex];
				var rootFingerprint = base64sha256(rootDER);

				//Insert root certificate
				this.db.insertRootCertificate(rootFingerprint, rootDER);

				//Insert log-root relationship
				this.db.insertLogRoot(logObj.fingerprint, rootFingerprint);

			}
		}

		console.log("Root fetching DONE");
		updateLogLists();
		resetExplorer();

	}

	//TODO general case
	calculateIntersections(depth){
		var sets = new Array();

		var intersections = this.db.getIntersections(depth);
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

		var sets_numeric = new Array();

		for (var key in sets)
		if (sets.hasOwnProperty(key))
		sets_numeric.push( sets[key] );

		return sets_numeric;

	}


	updateLogLists() {

		//clear the list
		$("#logs_chrome .ok, .unavailable, .disqualified, .other").text("");

		var logs = this.db.listLogs();
		var stats = this.db.logStats();

		for (var key in logs) {

			if (!logs.hasOwnProperty(key)) {
				continue;
			}
			var logObj = logs[key];

			var subcategory = "ok";
			var disabledString = "";
			var disqualifiedString = "";
			var chromeTrustedString = "";

			if (logObj.disqualified_at > 0){
				disqualifiedString = "disqualified";
			} else if (logObj.chrome_trusted){
				chromeTrustedString = "chromeTrusted";
			}

			if (logObj.root_count_json == null) {
				subcategory = "unavailable";
				disabledString = "disabled";
			}

			if (logObj.key == null){
				subcategory = "other";
			}

			$("#logs ." + subcategory).append(
				'<div class="' + [disqualifiedString, chromeTrustedString].join(" ") + '">' +
				'<input type="checkbox" id="' + logObj.fingerprint + '" ' + disabledString + " " +
				'onclick="logToggle(this)" '+
				'name="' + logObj.fingerprint + '" ' + (logObj.checked == true ? "checked" : "") +' >' +
				'<label for="'+ logObj.fingerprint +'" title="' + Array(logObj.url, disqualifiedString, chromeTrustedString).join(' ') +'">'+ logObj.description +
				' <a target="_blank" title="Number of certificates in JSON response" href="https://' + logObj.url +
				'ct/v1/get-roots">[' + logObj.root_count_json + ']</a> '+
				(logObj.root_count_distinct != logObj.root_count_json && logObj.root_count_json ? ( ' (' + logObj.root_count_distinct + ' distinct)' ) : '') +
				'</label></div>'
			);
		}

		$( "#progress-label" ).text("Logs and root-stores: " + stats["1"].online + " Unique roots: " +stats["1"].roots);
		$("#dumpDatabaseButton").show();
	}

	//Toggle log in the Database
	logToggle(logDOM){

		this.db.logSetChecked(logDOM.name, +$(logDOM).is(":checked"));
		resetExplorer();
	}

	parseLog(logObj) {
		logObj.fingerprint = base64sha256(logObj.key);
		logObj.log_list = this.toString();

		//insert log
		this.db.insertLog(logObj);

		//update if disqualified
		if (logObj.disqualified_at){
			this.db.logSetDisqualifiedAt(logObj.fingerprint, logObj.disqualified_at);
		}

		//insert log into a list
		this.db.insertLogList(logObj.fingerprint, this.toString());

		requestRoots(logObj);
	}

	/* Reset necessary elements on update */
	resetExplorer(){

		$("#venn-approximate-warning").hide();
		console.log("Resetting the explorer");

		var sets = calculateIntersections(parseInt($('#intersection-depth').find(":selected").text()));
		initVenn(sets);

		$( "#progressbar" ).progressbar({
			value: 100
		});
		$('#tabs').tabs("option", "active", 0);
		$('#complement, .complement').hide();
		$('#intersection, .intersection').hide();
	}

	exploreRoots(d, i){

		$('#intersection, .intersection').show();
		prepareDataTable('intersection', d);

		if ( d.sets.length > 1 ){
			prepareDataTable('complement', d);
			$('#complement, .complement').show();
		} else {
			$('#complement, .complement').hide();
		}

		$('#tabs').tabs("option", "active", 1);
		$('.x509').trigger("click");

	}

	exploreRankedRoots(d, i){
		d.sets = [];
		d.label = 'Certificates with rank ' + d.rank;
		prepareDataTable('rank', d);

		$('#complement, .complement').show();
		$('#intersection, .intersection').hide();

		$('#tabs').tabs("option", "active", 1);
		$('.x509').trigger("click");
	}

	exploreUnion(){
		d = {sets : []}
		d.label = 'Union of selected logs/stores';

		prepareDataTable('union', d);

		$('#complement, .complement').hide();
		$('#intersection, .intersection').show();

		$('.x509').trigger("click");
	}

	//tableName values: 'intersection' - main DataTable, 'complement' - secondary DataTable
	//d.sets[] - fingerprints of logs
	//d.label - table caption
	//d.rank - number of logs/stores
	prepareDataTable(tableName, d){
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
			stmt = this.db.getIntersectionsStatement(mask, params)
			break;
			case 'complement':
			stmt = this.db.getComplementStatement(mask, params)
			break;
			case 'rank':
			stmt = this.db.getFrequencyStatement(d.rank)
			break;
			case 'union':
			stmt = this.db.getUnionStatement()

		}
		var data = [];

		while (stmt.step()) {
			var root = stmt.getAsObject();
			x.readCertPEM(X509BEGIN + root.der + X509END);
			root.x509Version = "v" + x.version;
			root.subject = x.getSubjectString();
			root.issuer = x.getIssuerString();
			if (root.issuer == root.subject){
				root.issuer = "";
			}
			//TODO: parse UTCTime with exceptions
			root.notBefore = x.getNotBefore();//.substr(0,6).replace(/(..)(..)(..)/,"$1-$2-$3");
			root.notAfter = x.getNotAfter();//.substr(0,6).replace(/(..)(..)(..)/,"$1-$2-$3");
			root.info = x.getInfo();
			root.signatureAlgorithm = x.getSignatureAlgorithmName();
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
			label += ' [' + this.db.getSelectedLogDescriptions(', ') +']';
			break;
			case 'union':
			tableName = 'intersection' //TODO: looks ambiguous
			label = this.db.getSelectedLogDescriptions(' ∪ ')
			break;
		}

		table = $('#' + tableName + ' table')
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

	}

	initVenn(sets){

		var div = d3.select("#venn")
		div.datum(sets).call(chart);

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
		.on("click", exploreRoots)

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
	}

	fetchLogs(listName){

		$.getJSON(logLists[listName].url, function(response){
			logLists[listName].response = response;
			logLists[listName].response.logs.forEach(parseLog, listName);
		})
		.fail(function() { alert('Failed to fetch ' + listName); location.reload() })
		.always(function() {  });
	}

	vennShuffleLayers(){
		var parent = $("#venn svg");
		var divs = parent.children();
		while (divs.length) {
			parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
		}
	}

	startExplorer(){

		$( "#progressbar" ).progressbar({
			value: false
		});

		$( "#progress-label" ).text("Loading Certificate Transparency Logs and their roots...");

		fetchLogs("logs_chrome");
		fetchLogs("logs_known");

		setTimeout(fetchRoots, ajaxTimeout + 5000, "logs_known");

	}

	dumpDatabase() {
		var blob = new Blob([this.db.export()], {type: "application/octet-stream"}),
		url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'root-explorer.'+$.datepicker.formatDate('yy-mm-dd', new Date())+'.db';
		a.click();
		window.URL.revokeObjectURL(url);
	};

	function startExplorerOffline(snapshot){
		$( "#progressbar" ).progressbar({
			value: false
		});

		$( "#progress-label" ).text("Loading a snapshot of logs and roots...");

		this.db.importSnapshot(snapshot)

		try {
			updateLogLists()
		} catch {
			alert("Failed to load a snapshot. Only CT-Root-Explorer dumps are supported.")
			location.reload()
		}

		resetExplorer()
		$( "#progress-label" ).prepend("[DUMP]")
		console.log("Offline mode STARTED")

	}

	loadSnapshotAndStart(snapshot){
		console.log("Loading an offline snapshot.");
		var reader = new FileReader();
		reader.onload = function(e) {
			startExplorerOffline(new Uint8Array(e.target.result));
		};
		reader.readAsArrayBuffer(snapshot);
	}

	function start(){

		if (!(/Chrom/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor))){
			$( "#progress-label" ).text("Only Chrome and Chromium are supported, sorry.");
			$("#main").hide();
			return
		}

		this.chart = venn.VennDiagram()
		.width(600)
		.height(500);

		$( "#intersection-depth").selectmenu();

		$( "#tabs" ).tabs();
		$( document ).tooltip();
		$("#venn-approximate-warning").hide();

		$( "#progressbar" ).progressbar({
			value: 0
		});

		$( "#dialog-confirm" ).dialog({
			resizable: false,
			width: "80%",
			modal: true,
			buttons: {

				DEFAULT_SNAPSHOT_DESCRIPTION: function() {
					$( this ).dialog( "close" );
					$.ajax({
						xhrFields:{
							responseType: 'blob'
						},
						url: DEFAULT_SNAPSHOT_URL,
						timeout: ajaxTimeout,
						success: function(response, textStatus, jqXHR ){
							loadSnapshotAndStart(response);
						}
					}).always(function() { })
					.fail(function( ) {
						alert("Failed to load a snapshot.")
						location.reload()
					});

				},
				"Live log scan": function() {
					$( this ).dialog( "close" );
					startExplorer();
				},
				"Import a snapshot": function() {
					$( this ).dialog( "close" );
					$('#dump').on('change', function(e){
						var dump = e.target.files[0];
						if (!dump) {
							return;
						}
						loadSnapshotAndStart(dump);
					});

					$("#dump").click();

				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});

		$(document).keypress(vennShuffleLayers);
		$("#intersection-depth").on('selectmenuchange', resetExplorer);
		document.addEventListener('venn_approximate', function (e) {
			$("#venn-approximate-warning").show();
		});

	}

	plotRootFrequencyDistribution(){

		var stmt = this.db.getFrequencyDistributionStatement();
		var data = [];

		while (stmt.step()) {
			var rankedRoots = stmt.getAsObject();
			data.push(rankedRoots);
		}

		d3.select("#ranks").selectAll("svg").remove()
		var margin = {top: 20, right: 20, bottom: 40, left: 40},
		width = 600 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

		var y = d3.scaleBand()
		.range([height, 0])
		.padding(0.1);

		var x = d3.scaleLinear()
		.range([0, width]);

		var svg = d3.select("#ranks").append("svg")
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
		.on('click', exploreRankedRoots);

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
		.text("Rank");

	}
}
