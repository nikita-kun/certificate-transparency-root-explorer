class RootExplorerDB{

  const intersectionQuery2 = "SELECT log.fingerprint, log2.fingerprint, (SELECT count(DISTINCT log_root.root_fingerprint) FROM log_root inner join log_root AS log_root2 ON log_root2.root_fingerprint = log_root.root_fingerprint WHERE log_root.log_fingerprint = log.fingerprint and log_root2.log_fingerprint = log2.fingerprint), log.description AS d, log2.description AS d2 FROM log inner join log AS log2 WHERE log.checked and log2.checked and log.fingerprint >= log2.fingerprint";

  const intersectionQuery3 = "SELECT log.fingerprint, log2.fingerprint, log3.fingerprint, (SELECT count(DISTINCT log_root.root_fingerprint) FROM log_root inner join log_root AS log_root2 ON log_root2.root_fingerprint = log_root.root_fingerprint inner join log_root AS log_root3 ON log_root3.root_fingerprint = log_root.root_fingerprint WHERE log_root.log_fingerprint = log.fingerprint and log_root2.log_fingerprint = log2.fingerprint and log_root3.log_fingerprint = log3.fingerprint), log.description AS d, log2.description AS d2, log3.description AS d3 FROM log inner join log AS log2 inner join log AS log3 WHERE log.checked and log2.checked and log3.checked and log.fingerprint >= log2.fingerprint and log2.fingerprint >= log3.fingerprint group by (log.fingerprint || log2.fingerprint || log3.fingerprint)";


  constructor(){
    this.db = new SQL.Database();
  }

  logStats(){
    return this.resultToHashtable(this.db.exec("SELECT 1, (SELECT SUM(root_count_json IS NOT NULL) FROM log) AS online, (SELECT COUNT(DISTINCT root_fingerprint) FROM log_root) AS roots")[0], "1");
  }

  listLogs(){
    return this.resultToHashtable(this.db.exec("SELECT log.*, MAX(log_list = 'logs_chrome')  AS chrome_trusted, count(DISTINCT root_fingerprint) AS root_count_distinct FROM log LEFT JOIN log_list ON log_list.fingerprint = log.fingerprint LEFT JOIN log_root ON log_root.log_fingerprint = log.fingerprint GROUP BY log.fingerprint ORDER BY description ASC")[0], "fingerprint");
  }

  getIntersections(depth){
    switch (depth){
      case 2: return this.db.exec(intersectionQuery2)[0];
      case 3: return this.db.exec(intersectionQuery3)[0];
    }
    return null;
  }

  //Update number of roots for a log (number of certificates in a JSON response)
  updateLogRootCountJSON(logFingerprint, rootCountJSON){
    try {
      this.db.run("UPDATE log SET root_count_json = ? WHERE fingerprint = ?",
      [rootCountJSON,
        logFingerprint
      ]);
    } catch (error) { })
  }

  insertRootCertificate(fingerprint, der){
    try {
      this.db.run("INSERT INTO root (fingerprint, der) VALUES (?,?)",
      [fingerprint,
        der
      ]);
    } catch (error) { }
  }

  //Insert log-root relationship
  insertLogRoot(logFingerprint, rootFingerprint){
    try {
      this.db.run("INSERT INTO log_root (log_fingerprint, root_fingerprint) VALUES (?,?)",
      [logFingerprint,
        rootFingerprint
      ]);
    } catch (error) { }
  }

  rowToObject(values, columns){

    var obj = {};

    for (var i = 0; i < values.length; i++){
      obj[columns[i]] = values[i];
    }

    return obj;
  }


  resultToHashtable(result, keyName){

    var obj = {}

    if (typeof result == 'undefined' || typeof result.values == 'undefined')
    return obj;

    var key = result.columns.indexOf(keyName)

    for (var i = 0; i < result.values.length; i++){
      obj[result.values[i][key]] = this.rowToObject(result.values[i], result.columns);
    }

    return obj;
  }

}
