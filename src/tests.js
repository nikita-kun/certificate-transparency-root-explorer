QUnit.module( "Basic tests" );
QUnit.test( "Browser compatibility", function( assert ) {
  assert.ok( RootExplorer.isCompatibleToBrowser(), "The browser is compatible with the RootExplorer (Chrome/Chromium)" );
});

var mdmr = 'MIIFzTCCA7WgAwIBAgIJAJ7TzLHRLKJyMA0GCSqGSIb3DQEBBQUAMH0xCzAJBgNVBAYTAkdCMQ8wDQYDVQQIDAZMb25kb24xFzAVBgNVBAoMDkdvb2dsZSBVSyBMdGQuMSEwHwYDVQQLDBhDZXJ0aWZpY2F0ZSBUcmFuc3BhcmVuY3kxITAfBgNVBAMMGE1lcmdlIERlbGF5IE1vbml0b3IgUm9vdDAeFw0xNDA3MTcxMjA1NDNaFw00MTEyMDIxMjA1NDNaMH0xCzAJBgNVBAYTAkdCMQ8wDQYDVQQIDAZMb25kb24xFzAVBgNVBAoMDkdvb2dsZSBVSyBMdGQuMSEwHwYDVQQLDBhDZXJ0aWZpY2F0ZSBUcmFuc3BhcmVuY3kxITAfBgNVBAMMGE1lcmdlIERlbGF5IE1vbml0b3IgUm9vdDCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAKoWHPIgXtgaxWVIPNpCaj2y5Yj9t1ixe5PqjWhJXVNKAbpPbNHA/AoSivecBm3FTD9DfgW6J17mHb+cvbKSgYNzgTk5e2GJrnOP7yubYJpt2OCw0OILJD25NsApzcIiCvLA4aXkqkGgBq9FiVfisReNJxVu8MtxfhbVQCXZf0PpkW+yQPuF99V5Ri+grHbHYlaEN1C/HM3+t2yMR4hkd2RNXsMjViit9qCchIi/pQNt5xeQgVGmtYXyc92ftTMrmvduj7+pHq9DEYFt3ifFxE8v0GzCIE1xR/d7prFqKl/KRwAjYUcpU4vuazywcmRxODKuwWFVDrUBkGgCIVIjrMJWStH5i7WTSSTrVtOD/HWYvkXInZlSgcDvsNIG0pptJaEKSP4jUzI3nFymnoNZn6pnfdIII/XISpYSVeyl1IcdVMod8HdKoRew9CzW6f2n6KSKU5I8X5QEM1NUTmRLWmVi5c75/CvS/PzOMyMzXPf+fE2Dwbf4OcR5AZLTupqp8yCTqo7ny+cIBZ1TjcZjzKG4JTMaqDZ1Sg0T3mO/ZbbiBE3N8EHxoMWpw8OP50z1dtRRwj6qUZ2zLvngOb2EihlMO15BpVZC3Cg929c9Hdl65pUd4YrYnQBQB/rn6IvHo8zot8zElgOg22fHbViijUt3qnRggB40N30MXkYGwuJbAgMBAAGjUDBOMB0GA1UdDgQWBBTzX3t1SeN4QTlqILZ8a0xcyT1YQTAfBgNVHSMEGDAWgBTzX3t1SeN4QTlqILZ8a0xcyT1YQTAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUAA4ICAQB3HP6jRXmpdSDYwkI9aOzQeJH4x/HDi/PNMOqdNje/xdNzUy7HZWVYvvSVBkZ1DG/ghcUtn/wJ5m6/orBn3ncnyzgdKyXbWLnCGX/V61PgIPQpuGo7HzegenYaZqWz7NeXxGaVo3/y1HxUEmvmvSiioQM1cifGtz9/aJsJtIkn5umlImenKKEV1Ly7R3Uz3Cjz/Ffac1o+xU+8NpkLF/67fkazJCCMH6dCWgy6SL3AOB6oKFIVJhw8SD8vptHaDbpJSRBxifMtcop/85XUNDCvO4zkvlB1vPZ9ZmYZQdyL43NA+PkoKy0qrdaQZZMq1Jdp+Lx/yeX255/zkkILp43jFyd44rZ+TfGEQN1WHlp4RMjvoGwOX1uGlfoGkRSgBRj7TBn514VYMbXu687RS4WY2v+kny3PUFv/ZBfYSyjoNZnU4Dce9kstgv+gaKMQRPcyL+4vZU7DV8nBIfNFilCXKMN/VnNBKtDV52qmtOsVghgai+QE09w15x7dg+44gIfWFHxNhvHKys+s4BBN8fSxAMLOsb5NGFHE8x58RAkmIYWHjyPM6zB5AUPw1b2A0sDtQmCqoxJZfZUKrzyLz8gS2aVujRYN13KklHQ3EKfkeKBG2KXVBe5rjMN/7Anf1MtXxsTY6O8qIuHZ5QlXhSYzE41yIlPlG6d7AGnTiBIgeg==';
var digicert_test1 = "MIIDWDCCAkCgAwIBAgIQCvJjzJWIpHgdCfQW/QhDJzANBgkqhkiG9w0BAQsFADBGMQswCQYDVQQGEwJVUzEXMBUGA1UEChMORGlnaUNlcnQsIEluYy4xHjAcBgNVBAMTFURpZ2lDZXJ0IENUIFRlc3QgUm9vdDAeFw0xNzAxMTMwMDAwMDBaFw0zNzAxMTMwMDAwMDBaMEYxCzAJBgNVBAYTAlVTMRcwFQYDVQQKEw5EaWdpQ2VydCwgSW5jLjEeMBwGA1UEAxMVRGlnaUNlcnQgQ1QgVGVzdCBSb290MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtQI63lqz38iF53r2HX7hZ4pcZ3JBYdl0E8Rrx5DBqdw0TzWi8LDcbG6VWLhRY9NDpxcQ2N4jSGGW/dA47Wwcf7WqaGmME/W9S7g8yw17j66NPtzaH659xwwUBuUXDQQ/b6is/1q82Ab2TEA3gcFGx8NNbN09ZOC7Mr9zjs8JNfZTDNU/xMGCdTJtRtXyOhwrcB/MxiodUlshA9lD/sVIAie2LENtJv+F4KINuYjUuRfHkkHvYLts4X1fUOKMgxkxuHmpCLDSUIPqLPIArQTFzdKzmfgPhFint4Ekr1FK3sjd0k5u6DkPyznOAtJGT23E/evvB+ZySRdIL+Ntss7nGQIDAQABo0IwQDAdBgNVHQ4EFgQUNnMx5sCG6xby6wtwmajCMhMQWJ0wDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYwDQYJKoZIhvcNAQELBQADggEBACy/6H5CVk0/qRbqhmliQ7TboMpC5WWGYWV+xUDDwsM/eOlJLcur/ZJOWVMgurHVvCOU9yxEIu3n9TpPaIfyq9GdNywXFCJ/A0CO7+y7UkSSyJASvv+boMG5y3yRybh0tb1J232mVplaJFRHWggEPLYkqPccL1gdVWgLLl1JrGgzCUypbu6mn7UIWE1Sx6BROFkNAqWP1nl4lAZ28Sq7SJdfnOOoWpHs0kCLE63wy2yvFDOseLE/rQz76KTHyW3+gJOzjBpQcBMx25jqP7gLvA1exy5RBMWE35jMbovoPv+CuCF/OBeIPiSVEemu1hTqopw8ljpeOy+1b2bRNrbRL2A=";
var digicert_test2 = "MIIDZDCCAkygAwIBAgIQCZwimFuJKKRExVXxFYX6szANBgkqhkiG9w0BAQsFADBMMQswCQYDVQQGEwJVUzEXMBUGA1UEChMORGlnaUNlcnQsIEluYy4xJDAiBgNVBAMTGyhEZXYpIERpZ2lDZXJ0IENUIFRlc3QgUm9vdDAeFw0xNzAxMTMwMDAwMDBaFw0zNzAxMTMwMDAwMDBaMEwxCzAJBgNVBAYTAlVTMRcwFQYDVQQKEw5EaWdpQ2VydCwgSW5jLjEkMCIGA1UEAxMbKERldikgRGlnaUNlcnQgQ1QgVGVzdCBSb290MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy7zM8xOtEw84tt1yH0EbApo/vNrgsudGXeiRE9j9Nq7CyopHQPPaszxilGoQYFKii3cGLRs1ybLtdoa2dd3g0mV5e4d+b5k7zfHmt0vFKYfDIGdsq5ZVbYOhrdfHjrNY59T/8VvXujtdfZIHoHqF5P9lg+E9T5v4cVJs5prqM/pHseLRUqc3b/rD1jei1RBRzRUlPzM33615VJpv0y5vQI3pZbruVF4Y7v6Ft2FM5T7Bf2hVOyRubBLeYH+/ucaDtEYvuIhZ+SeLqkdvRaWqfVe4OZwN+bToijSBaSB9HGPH86bDzRMlrDKzK3HWRbv8xKRAPHnrdn69EB3xPGmlrwIDAQABo0IwQDAdBgNVHQ4EFgQUy09b8Dvr176x38YS1ThUmrf6IgAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYwDQYJKoZIhvcNAQELBQADggEBAEklLug2PtAySXLO2gEb34X3RhaRdPp3uW0ry/6mwyLZlw9yIaLp2oQkhVDtAawwJWj6EtaQw24JS3ndMHJLSCmN4crqLzQkrw3aUmXVdM5t2a/alxXWb9yUb046eD0zpT9LvtnRVJYUB5xcXSxtiWXgb69dWNGKCxk4q0Du007gp19gGSKoIvyWKZngRjG1sjpvs5ktg/E3EpXSXqaNXdC7DR9hSdmfWPsO3ep9phh4XDHKvqhgwCKAepS1hVe11m6CQPZNTUbXFW83V8sLrkQ1u+wFMuDwE1vynfGl75TPnu6mIJDHh8ZwfPf136Oy1gA6e5Ru2GG7crO9rp1HBNI=";

QUnit.test( "base64sha256: Get sha256 hashes from base64-encoded binaries", function( assert ) {
  assert.equal( base64sha256('MA=='), '5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9', "ASCII zero" );
  assert.equal( base64sha256(mdmr), '86d8219c7e2b6009e37eb14356268489b81379e076e8f372e3dde8c162a34134', "Hashing of Google's Merge Delay Monitor Root" );
});

QUnit.module("RootExplorerDB");

/* Primitives used for testing */
var snapshot;
var all_logs;

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

QUnit.test("Populate blank database, test and export", function (assert){

  db = new RootExplorerDB();
  assert.ok( db, "Init an SQL.js database with RootExplorer schema");
  assert.deepEqual( db.listLogs(), {}, "No logs in an empty database");
  assert.deepEqual( db.logsOnline(), 0, "Log count = 0 for an empty database");
  assert.deepEqual( db.rootCount(), 0, "No roots in an empty database");
  assert.notOk( db.getIntersections(2), "No intersections");
  stmt = db.getFrequencyDistributionStatement()
  assert.ok( stmt, "Get a statement for a recursive query getFrequencyDistributionStatement");

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

  assert.deepEqual( db.listLogs(), resultingListOfLogs, "List logs");
  snapshot = db.export();
  assert.ok( snapshot, "Export test database" );
});

QUnit.test("Import a test database and list logs", function (assert){
  db = new RootExplorerDB();
  db.importSnapshot(snapshot)
  assert.deepEqual( db.listLogs(), resultingListOfLogs, "List logs from an imported snapshot");
});

QUnit.module("Certificate Transparency");
QUnit.test("Test access to Google Argon2021 log", function (assert){
  assert.timeout( 10000 );
  assert.expect(3);
  var done = assert.async();
  $.getJSON("https://ct.googleapis.com/logs/argon2021/ct/v1/get-roots", function(response){
    assert.ok( response, "Got a response from the log" );
    assert.ok( response.certificates, "Response contains certificate array" );
    assert.ok( response.certificates.length > 0, "Google Argon has more than 0 trusted certificates");
    done();
  });
});

QUnit.test("Access and validate the list of Chrome-trusted logs", function (assert){
  assert.timeout( 10000 );
  assert.expect(7);
  var done = assert.async();
  $.getJSON("https://www.gstatic.com/ct/log_list/log_list.json", function(response){
    assert.ok( response, "Got the list of Chrome-trusted logs" );
    response = RootExplorer.ct.normalizeLogListResponse(response)
    assert.ok( response.logs, "Response contains array of logs" );
    assert.ok( response.logs.length > 0, "Array of logs is not empty")
    assert.equal( typeof response.logs[0].description, "string", "First log contains a description" );
    assert.equal( typeof response.logs[0].key, "string", "First log contains a key" );
    assert.equal( typeof response.logs[0].url, "string", "First log contains a URL" );
    assert.ok( response.logs[0].maximum_merge_delay, "First log contains a maximum_merge_delay" );
    done();
  });
});


QUnit.test("Access and validate Google's list of all-known-trusted logs", function (assert){
  assert.timeout( 10000 );
  assert.expect(7);
  var done = assert.async();
  $.getJSON("https://www.gstatic.com/ct/log_list/all_logs_list.json", function(response){
    assert.ok( response, "Got Google's list of all-known logs" );
    response = RootExplorer.ct.normalizeLogListResponse(response)
    assert.ok( response.logs, "Response contains array of logs" );
    assert.ok( response.logs.length > 0, "Array of logs is not empty")
    assert.equal( typeof response.logs[0].description, "string", "First log contains a description" );
    assert.equal( typeof response.logs[0].key, "string", "First log contains a key" );
    assert.equal( typeof response.logs[0].url, "string", "First log contains a URL" );
    assert.ok( response.logs[0].maximum_merge_delay, "First log contains a maximum_merge_delay" );
    done();
  });
});


$.getJSON("https://www.gstatic.com/ct/log_list/all_logs_list.json", function(response){
  QUnit.module("Submission: Merge Delay Monitor Root");
  response = RootExplorer.ct.normalizeLogListResponse(response);

  response.logs.forEach(function(log){
    QUnit.test(log.description, function (assert){
      assert.timeout(5000);
      assert.expect(4);

      var done = assert.async();
      $.getJSON("https://" + log.url + "ct/v1/get-roots", function(roots){
        assert.ok( roots, "Got a response from the log" );
        assert.ok( roots.certificates, "Response contains certificate array" );
        assert.ok( roots.certificates.length > 0, "More than 0 trusted certificates");
        $.ajax({
          type: "POST",
          url: "https://" + log.url + "ct/v1/add-chain",
          data: JSON.stringify({
            "chain": [mdmr]
          }),
          success: function(data){
            console.log(data);
            assert.equal(data.sct_version, 0, "SCT: " + JSON.stringify(data))
            done();
          },
          error: function(xhr, error){
            console.debug(xhr); console.debug(error); assert.notOk(xhr.responseText, "Submission failed"); done();
          },
        });
      }); 
    });
  });

  QUnit.module("Submission: Digicert Test Root 1");
  response.logs.forEach(function(log){
    QUnit.test(log.description, function (assert){
      assert.timeout(5000);
      assert.expect(4);

      var done = assert.async();
      $.getJSON("https://" + log.url + "ct/v1/get-roots", function(roots){
        assert.ok( roots, "Got a response from the log" );
        assert.ok( roots.certificates, "Response contains certificate array" );
        assert.ok( roots.certificates.length > 0, "More than 0 trusted certificates");
        $.ajax({
          type: "POST",
          url: "https://" + log.url + "ct/v1/add-chain",
          data: JSON.stringify({
            "chain": [digicert_test1]
          }),
          success: function(data){
            console.log(data);
            assert.equal(data.sct_version, 0, "SCT: " + JSON.stringify(data))
            done();
          },
          error: function(xhr, error){
            console.debug(xhr); console.debug(error); assert.notOk(xhr.responseText, "Submission failed"); done();
          },
        });
      }); 
    });
  });


  QUnit.module("Submission: Digicert Test Root 2");
  response.logs.forEach(function(log){
    QUnit.test(log.description, function (assert){
      assert.timeout(5000);
      assert.expect(4);

      var done = assert.async();
      $.getJSON("https://" + log.url + "ct/v1/get-roots", function(roots){
        assert.ok( roots, "Got a response from the log" );
        assert.ok( roots.certificates, "Response contains certificate array" );
        assert.ok( roots.certificates.length > 0, "More than 0 trusted certificates");
        $.ajax({
          type: "POST",
          url: "https://" + log.url + "ct/v1/add-chain",
          data: JSON.stringify({
            "chain": [digicert_test2]
          }),
          success: function(data){
            console.log(data);
            assert.equal(data.sct_version, 0, "SCT: " + JSON.stringify(data))
            done();
          },
          error: function(xhr, error){
            console.debug(xhr); console.debug(error); assert.notOk(xhr.responseText, "Submission failed"); done();
          },
        });
      }); 
    });
  });


  QUnit.module("Log size");
  response.logs.forEach(function(log){
    QUnit.test(log.description, function (assert){
      assert.timeout(5000);
      assert.expect(3);

      var done = assert.async();
      $.getJSON("https://" + log.url + "ct/v1/get-sth", function(sth){
        assert.ok( sth, "Got a response from the log" );
        assert.ok( sth.tree_size, "Tree size: " + sth.tree_size );
        assert.ok( sth.timestamp, "Timestamp: " + (new Date(sth.timestamp)).toISOString());
        done();
      }); 
    });
  });

/*
  QUnit.module("Resubmission (last certificate)");

  response.logs.forEach(function(log){

    QUnit.test(log.description, function (assert){
      assert.depth = 100;
      assert.timeout(5000);
      assert.expect(3);

      var done = assert.async();
      $.getJSON("https://" + log.url + "ct/v1/get-sth", function(sth){
        assert.ok( sth, "Got a response from the log" );

        //-1. get tree_size
        assert.ok( sth.tree_size, "Tree size: " + sth.tree_size )
        //0. get last n entries (check for tree_size > n)

          $.getJSON("https://" + log.url + "ct/v1/get-entries", 
            {
              start: sth.tree_size - assert.depth, 
              end: sth.tree_size
            }, 
            function(entries){
              console.log(entries);
              assert.ok(entries, "Recieved most recent log entries");
              
              //1. find a certificate ((int16)data[11] == 0)

              for (var i = 0; i < entries.entries.length; i++){
                var leaf = base64DecodeToBlob(entries.entries[i].leaf_input);

                if (leaf.slice(11,13) == base64DecodeToBlob("AAA=")){
                  console.log("CERT");
                } else console.log(leaf.slice(11,13),base64DecodeToBlob("AAA="),"PRECERT")
              
              }
              
              //2. extract the certificate (cert)data[16]
              //3. resubmit

              done();
            }
          );

        /*$.ajax({
          type: "POST",
          url: "https://" + log.url + "ct/v1/add-chain",
          data: JSON.stringify({
            "chain": [mdmr]
          }),
          success: function(data){
            console.log(data);
            assert.equal(data.sct_version, 0, "SCT: " + JSON.stringify(data))
            done();
          },
          error: function(xhr, error){
            console.debug(xhr); console.debug(error); assert.notOk(xhr.responseText, "Submission failed"); done();
          },
        });*/
        /*
      }); 
    });
  });
  */
});