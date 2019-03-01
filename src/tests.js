QUnit.module( "Basic tests" );
QUnit.test( "Browser compatibility", function( assert ) {
  assert.ok( RootExplorer.isCompatibleToBrowser(), "The browser is compatible with the RootExplorer" );
});

QUnit.module("Database");
QUnit.test("Blank database", function (assert){
  db = new RootExplorerDB();
  assert.ok( db, "Init an SQL.js database with RootExplorer schema");
  assert.ok( db.listLogs(), "List logs");
  assert.ok( db.logStats(), "Log stats");
  assert.notOk( db.getIntersections(2), "Intersections");
});
