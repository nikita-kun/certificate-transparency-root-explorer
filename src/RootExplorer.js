var RootExplorer = {

	X509BEGIN: "-----BEGIN CERTIFICATE-----\n",
	X509END: "\n-----END CERTIFICATE-----",

	logLists: {
		"logs_chrome": {
			url: "https://www.gstatic.com/ct/log_list/v3/log_list.json",
			response: null
		},
		"logs_known": {
			url: "https://www.gstatic.com/ct/log_list/v3/all_logs_list.json",
			response: null
		},
		"logs_apple": {
			url: "https://valid.apple.com/ct/log_list/current_log_list.json",
			response: null
		}
	},

	SNAPSHOTS: [{
			"url": "./root-explorer.2018-12-27.db",
			"description": "Snapshot @ 2018"
		},
		{
			"url": "./root-explorer.2019-10-08.db",
			"description": "Snapshot @ 2019"
		},
		{
			"url": "./root-explorer.2021-05-07.db",
			"description": "Snapshot @ 2021"
		},
		{
			"url": "./root-explorer.2024-10-25.db",
			"description": "Snapshot @ 2024"
		}
	],


	db: new RootExplorerDB(),
	ajaxTimeout: 30000,
	x: new X509(),
	liveScanPromises: [],
	liveScan: false,
	unresolvedLogs: [],
	resolvedLogs: [],
	//Request intersections of selected logs from the database;
	//Prepare the data for Venn.js
	//Supported intersection depth = 2 or 3
	//TODO general case
	calculateIntersections: function(depth) {
		var sets = [];

		var intersections = RootExplorer.db.getIntersections(depth);
		switch (depth) {
			case 2:

				if (typeof intersections == 'undefined')
					return sets;

				for (var i = 0; i < intersections.values.length; i++) {
					sets.push({
						"sets": (intersections.values[i][0] == intersections.values[i][1] ? [intersections.values[i][0]] : [intersections.values[i][0], intersections.values[i][1]]),
						"size": intersections.values[i][2],
						"label": (intersections.values[i][0] == intersections.values[i][1] ?
							intersections.values[i][3] :
							(intersections.values[i][3] + "<br>∩<br>" + intersections.values[i][4])
						)
					});
				}

				break;
			case 3:

				if (typeof intersections == 'undefined')
					return sets;

				var label, ids;

				for (let i = 0; i < intersections.values.length; i++) {
					switch (true) {
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

					sets[label] = ({
						"sets": ids,
						"size": intersections.values[i][3],
						"label": label
					});
				}

		}

		//Prepare data for Venn.js
		var sets_numeric = [];

		for (var key in sets) {
			if (sets.hasOwnProperty(key)) {
				sets_numeric.push(sets[key]);
			}
		}

		return sets_numeric;

	},

	view: {

		chart: venn.VennDiagram().width(600).height(500),

		start: async function() {

			$("#intersection-depth").selectmenu();

			$("#tabs").tabs();
			$(document).tooltip();
			$("#venn-approximate-warning").hide();

			$("#progressbar").progressbar({
				value: 0
			});

			const response = await fetch('README.md');
			if (response.ok) {
				document.querySelector("#readme > div").innerHTML = (await response.text())
					.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
					.replace(/\[(.*?)\]\((.*?)\)/g, '<a target="_blank" href="$2">$1</a>')
					.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
					.split('\n')
					.map(line => {
						if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
						if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
						if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
						if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
						return `<p>${line}</p>`;
					})
					.join('');
			}

			var startupDialog = $("#dialog-confirm").dialog({
				dialogClass: "no-close intro",
				resizable: true,
				modal: true,
				width: "auto",
				height: window.innerHeight,
				open: function(event, ui) {
					$('#main, #progressbar').hide();
				},
				close: function(event, ui) {
					$('#main, #progressbar').show();
				}
			});

			//add snapshot buttons to the startup dialog
			var startupDialogButtons = [{
				text: "Import a snapshot",
				click: function() {

					$('#dump').on('change', function(e) {
						var dump = e.target.files[0];
						if (!dump) {
							return;
						}
						$("#dialog-confirm").dialog("close");
						RootExplorer.loadSnapshotAndStart(dump);
					});

					$("#dump").click();

				}
			}];

			RootExplorer.SNAPSHOTS.forEach(function(snapshot) {
				startupDialogButtons.push({
					text: snapshot.description,
					click: function() {
						$(this).dialog("close");
						$.ajax({
								xhrFields: {
									responseType: 'blob'
								},
								url: snapshot.url,
								timeout: RootExplorer.ajaxTimeout,
								success: function(response, textStatus, jqXHR) {
									RootExplorer.loadSnapshotAndStart(response);
								}
							}).always(function() {})
							.fail(function() {
								alert("Failed to load a snapshot.");
								location.reload();
							});
					}
				});
			});

			startupDialogButtons.push({
				text: "Unit tests",
				click: function() {
					window.location.href = "./test.html?moduleId=3d395d83&moduleId=d8614993&moduleId=2148f2f5";
				}
			});
			startupDialogButtons.push({
				text: "Live scan",
				click: function() {
					$(this).dialog("close");
					RootExplorer.startLiveScan();
				}
			});

			startupDialog.dialog("option", "buttons", startupDialogButtons);

			$(document).keydown(function(event) {
				if (event.which === 32 && $("#tabs").tabs("option", "active") == 0) { //Space
					event.preventDefault();
					RootExplorer.view.vennShuffleLayers();
				}
			});
			$("#intersection-depth").on('selectmenuchange', RootExplorer.view.reset);
			document.addEventListener('venn_approximate', function(e) {
				$("#venn-approximate-warning").show();
			});

		},

		newRootStore: async function() {
			$(function() {
				$("#newRootStoreDialog").dialog({
					autoOpen: true,
					modal: true,
					width: "25cm",
					buttons: {
						"Submit": async function() {
							var jsonData = JSON.parse($("#rootStoreJSON").val());
							var log = RootExplorer.parseLog(jsonData, "logs_known");
							RootExplorer.unresolvedLogs.push(log);
							await RootExplorer.resolveLogProcess();
							RootExplorer.view.updateLogList();
							RootExplorer.view.reset();
							$(this).dialog("close");
							try {} catch (e) {
								alert("Invalid JSON: " + e.message);
							}
						},
						"Cancel": function() {
							$(this).dialog("close");
						}
					}
				});
			});
		},

		updateLogList: function() {

			//clear the list
			$("#logs .ok, #logs .unavailable, #logs  .disqualified, #logs .other").text("");

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

				if (log.disqualified_at > 0) {
					disqualifiedString = "disqualified";
				} else if (log.chrome_trusted) {
					chromeTrustedString = "chromeTrusted";
				}

				if (log.root_count_json == null) {
					subcategory = "unavailable";
					disabledString = "disabled";
				}

				if (log.key == null) {
					subcategory = "other";
				}

				$("#logs ." + subcategory).append(
					'<div class="' + [disqualifiedString, chromeTrustedString].join(" ") + '">' +
					'<input type="checkbox" id="' + log.fingerprint + '" ' + disabledString + " " +
					'onclick="RootExplorer.view.logToggle(this)" ' +
					'name="' + log.fingerprint + '" ' + (log.checked == true ? "checked" : "") + ' >' +
					'<label for="' + log.fingerprint + '" title="' + Array(log.url, disqualifiedString, chromeTrustedString).join(' ') + '">' + log.description +
					' <a target="_blank" title="Number of certificates in JSON response" href="https://' + log.url +
					'ct/v1/get-roots">[' + log.root_count_json + ']</a> ' +
					(log.root_count_distinct != log.root_count_json && log.root_count_json ? (' <b style="color:red">(' + (log.root_count_json - log.root_count_distinct) + ' duplicates)</b>') : '') +
					'</label></div>'
				);
			}

			$("#progress-label").text("Logs and root-stores: " + RootExplorer.db.logsOnline() + " Unique roots: " + RootExplorer.db.rootCount());
			$("#dumpDatabaseButton").show();
		},

		//Toggle log in the Database and reset the view
		logToggle: function(logDOM) {
			RootExplorer.db.logSetChecked(logDOM.name, +$(logDOM).is(":checked"));
			RootExplorer.view.reset();
		},

		/* Reset necessary elements on update */
		reset: function() {

			$("#venn-approximate-warning").hide();
			console.log("Resetting the explorer");

			var sets = RootExplorer.calculateIntersections(parseInt($('#intersection-depth').find(":selected").text()));
			RootExplorer.view.initVenn(sets);

			$("#progressbar").progressbar({
				value: 100
			});
			$('#tabs').tabs("option", "active", 0);
			$('#complement, .complement').hide();
			$('#intersection, .intersection').hide();
		},

		exploreSubsetOfRoots: function(d, i) {

			$('#intersection, .intersection').show();
			RootExplorer.view.prepareDataTable('intersection', d);

			if (d.sets.length > 1) {
				RootExplorer.view.prepareDataTable('complement', d);
				$('#complement, .complement').show();
			} else {
				$('#complement, .complement').hide();
			}

			$('#tabs').tabs("option", "active", 2);
			$('.x509').trigger("click");

		},

		exploreRootFrequency: function(d, i) {
			d.sets = [];
			d.label = 'Certificates with frequency ' + d.rank;
			RootExplorer.view.prepareDataTable('rank', d);

			$('#complement, .complement').show();
			$('#intersection, .intersection').hide();

			$('#tabs').tabs("option", "active", 2);
			$('.x509').trigger("click");
		},

		exploreUnion: function() {
			var d = {
				sets: []
			};
			d.label = 'Union of selected logs/stores';

			$('#complement, .complement').hide();
			$('#intersection, .intersection').show();
			RootExplorer.view.prepareDataTable('union', d);
			$('#tabs').tabs("option", "active", 3);
			$('.x509').trigger("click");
		},

		//tableName values: 'intersection' - main DataTable, 'complement' - secondary DataTable
		//d.sets[] - fingerprints of logs
		//d.label - table caption
		//d.rank - number of logs/stores
		prepareDataTable: function(tableName, d) {
			var logs = d.sets;

			var mask = "";
			for (var i = 0; i < logs.length; i++) {
				mask += ('?' + (i < logs.length - 1 ? ',' : ''));
			}

			var params = logs.slice(0);
			params.push(logs.length);

			var stmt;

			switch (tableName) {
				case 'intersection':
					stmt = RootExplorer.db.getIntersectionsStatement(mask, params);
					break;
				case 'complement':
					stmt = RootExplorer.db.getComplementStatement(mask, params);
					break;
				case 'rank':
					stmt = RootExplorer.db.getFrequencyStatement(d.rank);
					break;
				case 'union':
					stmt = RootExplorer.db.getUnionStatement();

			}
			var data = [];

			while (stmt.step()) {
				var root = stmt.getAsObject();

				RootExplorer.x.readCertPEM(RootExplorer.X509BEGIN + root.der + RootExplorer.X509END);

				root.x509Version = "v" + RootExplorer.x.version;
				root.subject = RootExplorer.x.getSubjectString();
				root.issuer = RootExplorer.x.getIssuerString();
				if (root.issuer == root.subject) {
					root.issuer = "";
				}
				//TODO: parse UTCTime with exceptions
				root.notBefore = RootExplorer.x.getNotBefore(); //.substr(0,6).replace(/(..)(..)(..)/,"$1-$2-$3");
				root.notAfter = RootExplorer.x.getNotAfter(); //.substr(0,6).replace(/(..)(..)(..)/,"$1-$2-$3");			
				try {
					root.info = RootExplorer.x.getInfo();
				} catch (e) {
					console.log(e);
				}

				root.signatureAlgorithm = RootExplorer.x.getSignatureAlgorithmName();
				root.fingerprint = "<a target='_blank' class='fingerprint' href='https://crt.sh/?sha256=" + root.fingerprint + "'>" + root.fingerprint + "</a>";
				data.push(root);
			}

			var clmns = [{
					data: 'subject'
				},
				{
					data: 'issuer'
				},
				{
					data: 'notBefore'
				},
				{
					data: 'notAfter'
				},
				{
					data: 'x509Version'
				},
				{
					data: 'signatureAlgorithm'
				},
				{
					data: 'fingerprint'
				}
			];

			var label = d.label.replace(/<br>/g, " ");
			switch (tableName) {
				case 'complement':
					clmns.push({
						data: 'logs'
					});
					label = 'Complement( ' + label + ')';
					break;
				case 'rank':
					clmns.push({
						data: 'logs'
					});
					tableName = 'complement';
					label += ' [' + RootExplorer.db.getSelectedLogDescriptions(', ') + ']';
					break;
				case 'union':
					tableName = 'intersection';
					label = RootExplorer.db.getSelectedLogDescriptions(' ∪ ');
					break;
			}

			var table = $('#' + tableName + ' table');
			table.filter('caption').remove();
			table.prepend('<caption>' + label + '</caption>');

			table.DataTable({
				data: data,
				autoWidth: false,
				destroy: true,
				"scrollX": true,
				dom: 'B<"clear">lfrtip',
				buttons: [
					'copy', 'csv', 'excel', 'print'
				],
				columns: clmns,
				caption: label
			});

			//set table caption and the header
			$('h3.' + tableName).text(label);

		},

		initVenn: function(sets) {

			var div = d3.select("#venn");

			div.datum(sets).call(RootExplorer.view.chart);
			div.select('svg').attr('viewBox', '0 0 500 600');

			var tooltip = d3.select("#venntooltip");

			div.selectAll("path")
				.style("stroke-opacity", 0)
				.style("stroke", "#000")
				.style("stroke-width", 3);

			div.selectAll("g")
				.on("mouseover", function(d, i) {

					// Display a tooltip with the current size
					tooltip.transition().duration(400).style("opacity", 0.9).style("display", "block");

					tooltip.html("<b>" + d.size + " roots</b><br>" + d.label);

					// highlight the current path
					var selection = d3.select(this).transition("tooltip").duration(400);
					selection.select("path")
						.style("fill-opacity", d.sets.length == 1 ? 0.4 : 0.1)
						.style("stroke-opacity", 1);
					$(d.sets).hide();
				})
				.on("click", RootExplorer.view.exploreSubsetOfRoots)

				.on("mousemove", function() {
					tooltip.style("left", (d3.event.pageX + 50) + "px")
						.style("top", (d3.event.pageY - 100) + "px");
				})

				.on("mouseout", function(d, i) {
					tooltip.transition().duration(400).style("opacity", 0).style("display", "none");
					var selection = d3.select(this).transition("tooltip").duration(400);
					selection.select("path")
						.style("fill-opacity", d.sets.length == 1 ? 0.25 : 0.0)
						.style("stroke-opacity", 0);
				});
		},

		plotRootFrequencyDistribution: function() {

			var stmt = RootExplorer.db.getFrequencyDistributionStatement();
			var data = [];

			while (stmt.step()) {
				var frequency = stmt.getAsObject();
				data.push(frequency);
			}

			d3.select("#root-frequencies").selectAll("svg").remove();
			var margin = {
					top: 20,
					right: 20,
					bottom: 40,
					left: 40
				},
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
				.attr('viewBox', '0 0 600 400')
				.append("g")
				.attr("transform",
					"translate(" + margin.left + "," + margin.top + ")");

			x.domain([0, d3.max(data, function(d) {
				return d.roots;
			})]);
			y.domain(data.map(function(d) {
				return d.rankx;
			}));

			svg.selectAll(".bar")
				.data(data)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("width", function(d) {
					return x(d.roots);
				})
				.attr("y", function(d) {
					return y(d.rankx);
				})
				.attr("height", y.bandwidth())
				.on('click', RootExplorer.view.exploreRootFrequency);

			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x));

			svg.append("g")
				.call(d3.axisLeft(y));

			svg.append("text")
				.attr("transform",
					"translate(" + (width / 2) + " ," +
					(height + margin.top + 15) + ")")
				.style("text-anchor", "middle")
				.text("Number of certificates");

			svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0 - margin.left)
				.attr("x", 0 - (height / 2))
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.text("Frequency");

		},

		vennShuffleLayers: function() {
			if (window.getSelection) {
				window.getSelection().removeAllRanges();
			} else if (document.selection) {
				document.selection.empty();
			}
			var parent = $("#venn svg");
			var divs = parent.children();
			while (divs.length) {
				parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
			}
		}
	},


	parseLog: function(log, logList = "logs_known") {
		log.fingerprint = log.fingerprint || base64sha256(log.key);

		//insert log
		RootExplorer.db.insertLog(log);

		//update if disqualified
		if (log.disqualified_at) {
			RootExplorer.db.logSetDisqualifiedAt(log.fingerprint, log.disqualified_at);
		}

		//insert log into a list
		if (logList == "logs_chrome" && !log.chrome_trusted)
			logList = "logs_known";
		RootExplorer.db.insertLogList(log.fingerprint, logList);

		return log;
	},

	resolveLogProcess: async function() {

		var progress = 100.0 * RootExplorer.unresolvedLogs.length / (RootExplorer.unresolvedLogs.length + RootExplorer.resolvedLogs.length);
		$("#progressbar").progressbar({
			value: progress
		});

		return new Promise(async (resolve) => {

			//take an unresolved log
			if (RootExplorer.unresolvedLogs.length) {

				const log = RootExplorer.unresolvedLogs.pop();
				RootExplorer.resolvedLogs.push(log);
				$("#progress-label").text(`Downloading roots from ${log.description}`);
				//request roots
				try {
					if (!log.roots)
						await RootExplorer.ct.requestRoots(log);
					if (typeof log.roots == 'undefined' || typeof log.roots.certificates == 'undefined') {
						throw new Error("Bad root list " + log.description);
					}
					console.log("Parsing roots of " + log.description, log);
					//Update number of roots for a log presented in a JSON response
					RootExplorer.db.updateLogRootCountJSON(log.fingerprint, log.roots.certificates.length);

					//For each root certificate
					for (let rootIndex = 0; rootIndex < log.roots.certificates.length; rootIndex++) {
						var rootDER = log.roots.certificates[rootIndex];
						var rootFingerprint = base64sha256(rootDER);

						//Insert root certificate
						RootExplorer.db.insertRootCertificate(rootFingerprint, rootDER);

						//Insert log-root relationship
						RootExplorer.db.insertLogRoot(log.fingerprint, rootFingerprint);

					}
				} catch (e) {
					console.error(e);
				}
			}

			if (RootExplorer.unresolvedLogs.length) {
				var nextPromise = RootExplorer.resolveLogProcess();
				Promise.allSettled([nextPromise]).then(() => {
					resolve();
				});
			} else {
				$("#progress-label").text('Processing...');
				$("#progressbar").progressbar({
					value: false
				});
				resolve();
			}
		});

	},

	startLiveScan: async function() {
		RootExplorer.liveScan = true;

		$("#progressbar").progressbar({
			value: false
		});

		$("#progress-label").text("Downloading lists of certificate logs from Google and Apple...");

		await Promise.allSettled(Object.keys(RootExplorer.logLists).map(RootExplorer.ct.requestLogsFromList));
		Object.values(RootExplorer.logLists).forEach((logList) => {
			try {
				logList.response.logs.forEach((log) => {
					RootExplorer.unresolvedLogs.push(log);
				});
			} catch (e) {
				console.error(e);
			}
		});
		//deduplicate
		RootExplorer.unresolvedLogs = Object.values(RootExplorer.unresolvedLogs.reduce((result, log) => {
			const key = log.url;
			result[key] = result[key] ? {
				...result[key],
				chrome_trusted: result[key].chrome_trusted || log.chrome_trusted
			} : log;
			return result;
		}, {}));
		RootExplorer.unresolvedLogs = (arr => arr.map((value) => [Math.random(), value]).sort().map(([, value]) => value))(RootExplorer.unresolvedLogs);
		RootExplorer.resolvedLogs = [];

		RootExplorer.processes = [
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess(),
			RootExplorer.resolveLogProcess()
		];

		Promise.allSettled(RootExplorer.processes).then(async () => {
			await RootExplorer.stores.update();
			RootExplorer.view.updateLogList();
			RootExplorer.view.reset();
		});
	},


	dumpDatabase: function() {
		var blob = new Blob([RootExplorer.db.export()], {
				type: "application/octet-stream"
			}),
			url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'root-explorer.' + $.datepicker.formatDate('yy-mm-dd', new Date()) + '.db';
		a.click();
		window.URL.revokeObjectURL(url);
	},

	startExplorerOffline: function(snapshot) {
		$("#progressbar").progressbar({
			value: false
		});

		$("#progress-label").text("Loading a snapshot of logs and roots...");

		RootExplorer.db.importSnapshot(snapshot);

		try {
			RootExplorer.view.updateLogList();
		} catch(e) {
			alert("Failed to load a snapshot. Only CT-Root-Explorer dumps are supported.");
			location.reload();
		}

		RootExplorer.view.reset();
		$("#progress-label").prepend("[DUMP] ");
		console.log("Offline mode STARTED");

	},

	loadSnapshotAndStart: function(snapshot) {
		console.log("Loading an offline snapshot.");
		var reader = new FileReader();
		reader.onload = function(e) {
			RootExplorer.startExplorerOffline(new Uint8Array(e.target.result));
		};
		reader.readAsArrayBuffer(snapshot);
	},

	stores: {
		getCCADBRoots: async function() {
			//check ccadb
			await (await fetch('https://ccadb.my.salesforce-sites.com/')).text();
			//download csv statuses
			var roots = parseCSV(await (await fetch('https://ccadb.my.salesforce-sites.com/ccadb/AllCertificateRecordsCSVFormatv2')).text());
			console.log(roots);

			var stores = {
				"Microsoft": {
					description: `Microsoft (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					fingerprint: `Microsoft (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					key: null,
					url: 'www.ccadb.org/resources#',
					maximum_merge_delay: 0,
					chrome_trusted: false,
					roots: {
						certificates: []
					}
				},
				"Mozilla": {
					description: `Mozilla (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					fingerprint: `Mozilla (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					key: null,
					url: 'www.ccadb.org/resources#',
					maximum_merge_delay: 0,
					chrome_trusted: false,
					roots: {
						certificates: []
					}
				},
				"Apple": {
					description: `Apple (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					fingerprint: `Apple (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					key: null,
					url: 'www.ccadb.org/resources#',
					maximum_merge_delay: 0,
					chrome_trusted: false,
					roots: {
						certificates: []
					}
				},
				"Google Chrome": {
					description: `Google Chrome (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					fingerprint: `Google Chrome (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}) `,
					key: null,
					url: 'www.ccadb.org/resources#',
					maximum_merge_delay: 0,
					chrome_trusted: false,
					roots: {
						certificates: []
					}
				},
			};

			const entries = Object.values(roots);

			for (let i = 0; i < entries.length; i++) {

				const entry = entries[i];
				var cert;
				try {
					$("#progressbar").progressbar({
						value: (i / entries.length) * 100
					});

					$("#progress-label").text(`Downloading ${entry["Certificate Name"]}`);
				} catch (e) {}

				if (!entry["Status of Root Cert"] || !entry["Status of Root Cert"].includes(": Included") || entry["Certificate Record Type"] != "Root Certificate")
					continue;
				try {
					cert = RootExplorer.db.rootCert(entry["SHA-256 Fingerprint"].toLowerCase()) || (await (await fetchWithRetry(`https://crt.sh/?d=${entry["SHA-256 Fingerprint"]}`, 5)).text());
				} catch (e) {
					RootExplorer.unresolvedLogs = [];
					console.error(e);
					return alert("Failed to download CCADB root stores. " + e);
				}
				cert = cert.replace(RootExplorer.X509BEGIN, '').replace(RootExplorer.X509END, '').replaceAll('\n', '');

				if (entry["Microsoft Status"] == "Included")
					stores["Microsoft"].roots.certificates.push(cert);

				if (entry["Chrome Status"] == "Included")
					stores["Google Chrome"].roots.certificates.push(cert);

				if (entry["Mozilla Status"] == "Included")
					stores["Mozilla"].roots.certificates.push(cert);

				if (entry["Status of Root Cert"].includes("Apple: Included"))
					stores["Apple"].roots.certificates.push(cert);

			}

			console.log(stores);
			Object.keys(stores).forEach((key) => {
				var store = stores[key];
				RootExplorer.unresolvedLogs.push(RootExplorer.parseLog(store, "logs_known"));
			});
			await RootExplorer.resolveLogProcess();

		},

		update: async function() {
			try {
				$("#progressbar").progressbar({
					value: false
				});
				$("#progress-label").text("Trying to download CCADB root stores...");

				await RootExplorer.stores.getCCADBRoots();
			} catch (e) {
				console.error(e);
			}
			RootExplorer.view.updateLogList();
			RootExplorer.view.reset();
		}

	},

	ct: {
		requestRoots: function(log) {
			let myPromise = new Promise(function(rootsResolve, rootsReject) {
				$.ajax({
						dataType: "json",
						url: "https://" + log.url + "ct/v1/get-roots",
						timeout: RootExplorer.ajaxTimeout,
						success: function(response, textStatus, jqXHR) {
							log.roots = response;
							console.log("Got " + log.roots.certificates.length + " roots for " + log.description);
							rootsResolve();
						}
					}).always(function() {})
					.fail(function() {
						let error = "Failed to get-roots of " + log.description + " https://" + log.url + "ct/v1/get-roots ";
						console.log(error);
						rootsReject(error);
					});
			});
			return myPromise;

		},

		requestLogsFromList: function(listName) {

			let listPromise = new Promise(function(listResolve, listReject) {

				$.getJSON(RootExplorer.logLists[listName].url, function(response) {
						var normalizedResponse = RootExplorer.ct.normalizeLogListResponse(response, listName == 'logs_chrome');
						if (!normalizedResponse) {
							let error = "Failed to get logs from a Google's list (Incompatible schema)";
							listReject(error);
						}
						RootExplorer.logLists[listName].response = normalizedResponse;
						RootExplorer.logLists[listName].response.logs.forEach(function(value) {
							RootExplorer.parseLog(value, listName);
						});
						listResolve();
					})
					.fail(function() {
						let error = 'Failed to fetch ' + listName;
						listReject(error);
					})
					.always(function() {});
			});
			return listPromise;
		},

		/* When Google's log schema v2.0 comes,
		we have to automatically convert the new list into the legacy one */
		normalizeLogListResponse: function(response, chrome = false) {

			if (response.logs) {
				return response;
			}

			let normalizedResponse = {
				logs: []
			};

			if (!response.operators) {
				return normalizedResponse;
			}

			for (let operatorIndex = 0; operatorIndex < response.operators.length; operatorIndex++) {
				let operator = response.operators[operatorIndex];
				for (let logIndex = 0; logIndex < operator.logs.length; logIndex++) {
					var log = operator.logs[logIndex];
					let normalizedLog = {
						description: log.description,
						key: log.key,
						url: log.url.replace(/^(https?:|)\/\//, ''),
						maximum_merge_delay: log.mmd,
						chrome_trusted: chrome && log.state && (log.state.usable || log.state.qualified) != null
					};
					normalizedResponse.logs.push(normalizedLog);
				}
			}
			return normalizedResponse;
		}

	}

};
