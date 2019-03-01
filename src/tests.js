QUnit.module( "Basic tests" );
QUnit.test( "Browser compatibility", function( assert ) {
  assert.ok( RootExplorer.isCompatibleToBrowser(), "The browser is compatible with the RootExplorer" );
});

QUnit.module("RootExplorerDB");

var testDatabase;

QUnit.test("Populate blank database, test and export", function (assert){

  db = new RootExplorerDB();
  assert.ok( db, "Init an SQL.js database with RootExplorer schema");
  assert.deepEqual( db.listLogs(), {}, "No logs in an empty database");
  assert.deepEqual( db.logsOnline(), 0, "Log count = 0 for an empty database");
  assert.deepEqual( db.rootCount(), 0, "No roots in an empty database");
  assert.notOk( db.getIntersections(2), "No intersections");
  stmt = db.getFrequencyDistributionStatement()
  assert.ok( stmt, "Get a statement for a recursive query getFrequencyDistributionStatement");


  log = {
    fingerprint : "fingeprint1",
    description: "description1",
    key : "key1",
    url : "foo.bar",
    maximum_merge_delay : 100
  }

  log2 = {
    fingerprint : "fingeprint2",
    description: "description2",
    key : "key2",
    url : "foo2.bar",
    maximum_merge_delay : 200
  }

  assert.notOk( db.insertLog(log), "Insert a log")
  assert.notOk( db.insertLog(log2), "Insert another log")

  assert.notOk( db.insertLogList(log.fingeprint, "list1"), "Insert a log into a list")
  assert.notOk( db.insertLogList(log2.fingeprint, "list2"), "Insert another log into another list")

  assert.ok( db.insertLog(log), "Reject log duplicates")
  assert.notOk(db.logSetDisqualifiedAt(log.key, 0), "Set log's disqualidied_at")
  assert.notOk(db.logSetDisqualifiedAt(log.key, 1234567890),  "Update log's disqualidied_at")

  assert.notOk(db.insertRootCertificate("rootFingeprint1", "rootContents1"), "Insert a root certificate");
  assert.notOk(db.insertRootCertificate("rootFingeprint2", "rootContents2"), "Insert another root certificate");

  assert.notOk(db.logSetChecked(log.fingerprint), "Select a Log")
  assert.notOk(db.logSetChecked(log2.fingerprint), "Select another Log")

  assert.notOk(db.insertLogRoot(log.fingerprint, "rootFingerprint1"), "Insert a root into a log");
  assert.notOk(db.insertLogRoot(log2.fingerprint, "rootFingerprint2"), "Insert another root into another log");

  assert.notOk(db.updateLogRootCountJSON(log.fingerprint, 1), "Update JSON root count for a log");
  assert.notOk(db.updateLogRootCountJSON(log2.fingerprint, 1), "Update JSON root count for another log");

  assert.deepEqual(db.getSelectedLogDescriptions(), "description1, description2", "Get descriptions of selected logs")

  resultingListOfLogs = {
    "fingeprint1": {
      "checked": 1,
      "chrome_trusted": null,
      "description": "description1",
      "disqualified_at": null,
      "fingerprint": "fingeprint1",
      "key": "key1",
      "mmd": 100,
      "root_count_distinct": 1,
      "root_count_json": 1,
      "url": "foo.bar"
    },
    "fingeprint2": {
      "checked": 1,
      "chrome_trusted": null,
      "description": "description2",
      "disqualified_at": null,
      "fingerprint": "fingeprint2",
      "key": "key2",
      "mmd": 200,
      "root_count_distinct": 1,
      "root_count_json": 1,
      "url": "foo2.bar"
    }
  }

  assert.deepEqual( db.listLogs(), resultingListOfLogs, "List logs");
  testDatabase = db.export();
  assert.ok( testDatabase, "Export test database" );

});
