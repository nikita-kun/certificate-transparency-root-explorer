const X509BEGIN = "-----BEGIN CERTIFICATE-----\n"
const X509END = "\n-----END CERTIFICATE-----"

var ajaxTimeout = 10000;

//Create the database
var db = new SQL.Database();
var x = new X509();

var chart = venn.VennDiagram()
.width(600)
.height(500);

var logLists = { "logs_chrome" : {url:"https://www.gstatic.com/ct/log_list/log_list.json", response: null},
"logs_known" : {url: "https://www.gstatic.com/ct/log_list/all_logs_list.json", response: null}
};

var rootStores = { mozilla : {url: "https://ccadb-public.secure.force.com/mozilla/IncludedCACertificateReportPEMCSV"}}

function requestRoots(item) {
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

function fetchMozillaRootStore(){
	$.ajax({
		type: "GET",
		url: rootStores.mozilla.url,
		dataType: "text",
		success: function(data) {console.log(data)}
	});
}

function fetchRoots(listName){
	console.log("Fetching roots into the database");

	for (logIndex = 0; logIndex < logLists[listName].response.logs.length; logIndex++){
		var logObj = logLists[listName].response.logs[logIndex];

		//Skip non-responding logs
		if (typeof logObj.roots == 'undefined' || typeof logObj.roots.certificates == 'undefined' ){
			continue;
		}

		console.log("Fetching roots of " + logObj.description);

		//Update number of roots for a log presented in a JSON response
		try {
			db.run("UPDATE log SET root_count_json = ? WHERE fingerprint = ?",
			[logObj.roots.certificates.length,
				logObj.fingerprint
			]);
		} catch (error) { }

		for (rootIndex = 0; rootIndex < logObj.roots.certificates.length; rootIndex++){
			var rootDER = logObj.roots.certificates[rootIndex];
			var rootFingerprint = base64sha256(rootDER);

			try {
				db.run("INSERT INTO root (fingerprint, der) VALUES (?,?)",
				[rootFingerprint,
					rootDER
				]);
			} catch (error) { }

			try {
				db.run("INSERT INTO log_root (log_fingerprint, root_fingerprint) VALUES (?,?)",
				[logObj.fingerprint,
					rootFingerprint
				]);
			} catch (error) { }
		}
	}
	console.log("Root fetching DONE");
	updateLogLists();
	resetExplorer();

}

//TODO general case
function calculateIntersections(depth){
	var sets = new Array();

	const intersectionQuery2 = "SELECT log.fingerprint, log2.fingerprint, (SELECT count(DISTINCT log_root.root_fingerprint) FROM log_root inner join log_root AS log_root2 ON log_root2.root_fingerprint = log_root.root_fingerprint WHERE log_root.log_fingerprint = log.fingerprint and log_root2.log_fingerprint = log2.fingerprint), log.description AS d, log2.description AS d2 FROM log inner join log AS log2 WHERE log.checked and log2.checked and log.fingerprint >= log2.fingerprint";

	const intersectionQuery3 = "SELECT log.fingerprint, log2.fingerprint, log3.fingerprint, (SELECT count(DISTINCT log_root.root_fingerprint) FROM log_root inner join log_root AS log_root2 ON log_root2.root_fingerprint = log_root.root_fingerprint inner join log_root AS log_root3 ON log_root3.root_fingerprint = log_root.root_fingerprint WHERE log_root.log_fingerprint = log.fingerprint and log_root2.log_fingerprint = log2.fingerprint and log_root3.log_fingerprint = log3.fingerprint), log.description AS d, log2.description AS d2, log3.description AS d3 FROM log inner join log AS log2 inner join log AS log3 WHERE log.checked and log2.checked and log3.checked and log.fingerprint >= log2.fingerprint and log2.fingerprint >= log3.fingerprint group by (log.fingerprint || log2.fingerprint || log3.fingerprint)";

	switch (depth){
		case 2:
		var result = db.exec(intersectionQuery2)[0]

		if (typeof result == 'undefined')
		return sets;

		for (var i=0; i < result.values.length; i++){
			sets.push({"sets" : (result.values[i][0] == result.values[i][1] ?
				[result.values[i][0]] :
				[result.values[i][0], result.values[i][1]]
			),
			"size": result.values[i][2],
			"label": (result.values[i][0] == result.values[i][1] ?
				result.values[i][3] :
				(result.values[i][3] + "<br>∩<br>" + result.values[i][4])
			)});
		}

		break;
		case 3:
		var result = db.exec(intersectionQuery3)[0]

		if (typeof result == 'undefined')
		return sets;

		var label, ids;

		for (var i=0; i < result.values.length; i++){
			switch (true){
				case (result.values[i][0] == result.values[i][1] && result.values[i][1] == result.values[i][2]):
				label = result.values[i][4];
				ids = [result.values[i][0]];
				break;
				case (result.values[i][0] == result.values[i][1] || result.values[i][1] == result.values[i][2]):
				label = result.values[i][4] + "<br>∩<br>" + result.values[i][6];
				ids = [result.values[i][0], result.values[i][2]];
				break;

				default:
				label = result.values[i][4] + "<br>∩<br>" + result.values[i][5] + "<br>∩<br>" + result.values[i][6];
				ids = [result.values[i][0], result.values[i][1], result.values[i][2]];
			}

			sets[label] = ({"sets" : ids,
			"size": result.values[i][3],
			"label": label});
		}

	}

	var sets_numeric = new Array();

	for (var key in sets)
	if (sets.hasOwnProperty(key))
	sets_numeric.push( sets[key] );

	return sets_numeric;

}


function updateLogLists() {

	//clear the list
	$("#logs_chrome .ok, .unavailable, .disqualified").text("");
	$("#logs_chrome .ok").text("");

	var stats = resultToHashtable(db.exec("SELECT 1, (SELECT SUM(root_count_json IS NOT NULL) FROM log) AS online, (SELECT COUNT(DISTINCT root_fingerprint) FROM log_root) AS roots")[0], "1");

	var logs = resultToHashtable(db.exec("SELECT *, MAX(log_list = 'logs_chrome')  AS chrome_trusted, count(DISTINCT root_fingerprint) AS root_count_distinct FROM log LEFT JOIN log_list ON log_list.fingerprint = log.fingerprint LEFT JOIN log_root ON log_root.log_fingerprint = log.fingerprint GROUP BY log.fingerprint ORDER BY description ASC")[0], "fingerprint");


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

	$( "#progress-label" ).text("Online logs: " + stats["1"].online + " Unique roots: " +stats["1"].roots);
}

function logToggle(logInput){

	//console.log(logInput.name, $(logInput).is(":checked"))

	try {
		db.run("UPDATE log SET checked = ? WHERE fingerprint = ?",
		[+$(logInput).is(":checked"), logInput.name]);
	} catch (error) { }

	resetExplorer();
}

function parseLog(logObj) {
	logObj.fingerprint = base64sha256(logObj.key);
	logObj.log_list = this.toString();

	try {
		db.run("INSERT INTO log (fingerprint, description, key, url, mmd) VALUES (?,?,?,?,?)",
		[logObj.fingerprint,
			logObj.description,
			logObj.key,
			logObj.url,
			logObj.maximum_merge_delay
		]);
	} catch (error) { }

	if (logObj.disqualified_at){
		try {
			db.run("UPDATE log SET disqualified_at = ? WHERE fingerprint = ?",
			[logObj.disqualified_at,
				logObj.fingerprint
			]);
		} catch (error) { }
	}

	try {
		db.run("INSERT INTO log_list (fingerprint, log_list) VALUES (?,?)",
		[logObj.fingerprint,
			this.toString()
		]);
	} catch (error) { }

	requestRoots(logObj);
}

/* Reset necessary elements on update */
function resetExplorer(){

	$("#venn-approximate-warning").hide();
	console.log("Resetting the explorer");

	var sets = calculateIntersections(parseInt($('#intersection-depth').find(":selected").text()));
	initVenn(sets);

	$( "#progressbar" ).progressbar({
		value: 100
	});
	$('#tabs').tabs("option", "active", 0);
}

function exploreRoots(d, i){

	var logs = d.sets;

	var mask = "";
	for (var i=0; i<logs.length; i++){
		mask += ('?' + (i < logs.length - 1 ? ',' : ''))
	}

	var params = logs.slice(0);
	params.push(logs.length);

	var stmt = db.prepare("SELECT fingerprint, der FROM (SELECT root.*, count(distinct log.fingerprint) AS degree FROM log left join log_root ON log.fingerprint = log_root.log_fingerprint left join root ON root_fingerprint = root.fingerprint WHERE log.fingerprint in (" + mask + ") group by root.fingerprint) AS all_roots WHERE degree=?", params);

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
		root.fingerprint = "<a target='_blank' href='https://crt.sh/?sha256=" + root.fingerprint + "'>" + root.fingerprint + "</a>";
		data.push(root);
	}

	$('#root-explorer-table').DataTable( {
		data: data,
		destroy: true,
		"scrollX": true,
		dom: 'Bfrtip',
		buttons: [
			'copy' ,'csv', 'excel', 'print'
		],
		columns: [
			{ data: 'subject' },
			{ data: 'issuer' },
			{ data: 'notBefore' },
			{ data: 'notAfter' },
			{ data: 'x509Version' },
			{ data: 'signatureAlgorithm' },
			{ data: 'fingerprint' }
		]
	} );

	$('#root-explorer-table').prepend('<caption style="display:none">' + d.label.replace(/<br>/g," ") + '</caption>');
	$('#root-explorer-title').html(d.label.replace(/<br>/g," "));

	$('#tabs').tabs("option", "active", 1);
	$('.x509').trigger("click");

}

function initVenn(sets){

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



function fetchLogs(listName){

	$.getJSON(logLists[listName].url, function(response){
		logLists[listName].response = response;
		logLists[listName].response.logs.forEach(parseLog, listName);
	})
	.fail(function() { alert('Failed to fetch ' + listName); })
	.always(function() {  });
}

function vennShuffleLayers(){
	var parent = $("svg");
	var divs = parent.children();
	while (divs.length) {
		parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
	}
}

function startExplorer(){

	db.exec("CREATE TABLE log (fingerprint TEXT PRIMARY KEY, description TEXT, key TEXT, url TEXT, mmd INTEGER, disqualified_at INTEGER, root_count_json INT, checked INT DEFAULT 0);");
	db.exec("CREATE INDEX log_fingerprint_index ON log (fingerprint);");
	db.exec("CREATE TABLE log_list (fingerprint TEXT, log_list TEXT, PRIMARY KEY (fingerprint, log_list));");
	db.exec("CREATE TABLE log_root (log_fingerprint TEXT, root_fingerprint TEXT);");
	db.exec("CREATE INDEX log_root_index ON log_root (log_fingerprint, root_fingerprint);");
	db.exec("CREATE INDEX log_root_index2 ON log_root (root_fingerprint, log_fingerprint);");
	db.exec("CREATE TABLE root (fingerprint TEXT PRIMARY KEY, der TEXT);");
	db.exec("CREATE VIEW log_checked(fingerprint) AS SELECT fingerprint FROM log WHERE checked")

	$( "#progressbar" ).progressbar({
		value: false
	});

	$( "#progress-label" ).text("Loading Certificate Transparency Logs and their roots...");

	fetchLogs("logs_chrome");
	fetchLogs("logs_known");

	setTimeout(fetchRoots, ajaxTimeout + 5000, "logs_known");

	$(document).keypress(vennShuffleLayers);
	$("#intersection-depth").on('selectmenuchange', resetExplorer);
	document.addEventListener('venn_approximate', function (e) {
		$("#venn-approximate-warning").show();
	});
}

$(document).ready(function(){

	if (!(/Chrom/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor))){
		$( "#progress-label" ).text("Only Chrome and Chromium are supported, sorry.");
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

	$( "#dialog-confirm" ).dialog({
		resizable: false,
		width: "80%",
		modal: true,
		buttons: {
			"Start": function() {
				$( this ).dialog( "close" );
				startExplorer();
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});

});
