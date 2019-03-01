class RootExplorerDB{

  constructor(){
    this.db = new SQL.Database();
    this.db.exec("CREATE TABLE log (fingerprint TEXT PRIMARY KEY, description TEXT, key TEXT, url TEXT, mmd INTEGER, disqualified_at INTEGER, root_count_json INT, checked INT DEFAULT 0);");
    this.db.exec("CREATE INDEX log_fingerprint_index ON log (fingerprint);");
    this.db.exec("CREATE TABLE log_list (fingerprint TEXT, log_list TEXT, PRIMARY KEY (fingerprint, log_list));");
    this.db.exec("CREATE TABLE log_root (log_fingerprint TEXT, root_fingerprint TEXT);");
    this.db.exec("CREATE INDEX log_root_index ON log_root (log_fingerprint, root_fingerprint);");
    this.db.exec("CREATE INDEX log_root_index2 ON log_root (root_fingerprint, log_fingerprint);");
    this.db.exec("CREATE TABLE root (fingerprint TEXT PRIMARY KEY, der TEXT);");
    this.db.exec("CREATE VIEW log_checked(fingerprint) AS SELECT fingerprint FROM log WHERE checked")
  }

  importSnapshot(snapshot){
    this.db.close()
    this.db = new SQL.Database(snapshot)
  }

  export(){
    return this.db.export();
  }

  logsOnline(){
    return +this.db.exec("SELECT SUM(root_count_json IS NOT NULL) FROM log")[0].values[0][0];
  }

  rootCount(){
    return +this.db.exec("SELECT COUNT(DISTINCT root_fingerprint) FROM log_root")[0].values[0][0];
  }

  listLogs(){
    return this.resultToHashtable(this.db.exec("SELECT log.*, MAX(log_list = 'logs_chrome')  AS chrome_trusted, count(DISTINCT root_fingerprint) AS root_count_distinct FROM log LEFT JOIN log_list ON log_list.fingerprint = log.fingerprint LEFT JOIN log_root ON log_root.log_fingerprint = log.fingerprint GROUP BY log.fingerprint ORDER BY description ASC")[0], "fingerprint");
  }

  getIntersections(depth){
    switch (depth){
      case 2: return this.db.exec("SELECT log.fingerprint, log2.fingerprint, (SELECT count(DISTINCT log_root.root_fingerprint) FROM log_root inner join log_root AS log_root2 ON log_root2.root_fingerprint = log_root.root_fingerprint WHERE log_root.log_fingerprint = log.fingerprint and log_root2.log_fingerprint = log2.fingerprint), log.description AS d, log2.description AS d2 FROM log inner join log AS log2 WHERE log.checked and log2.checked and log.fingerprint >= log2.fingerprint")[0];
      case 3: return this.db.exec("SELECT log.fingerprint, log2.fingerprint, log3.fingerprint, (SELECT count(DISTINCT log_root.root_fingerprint) FROM log_root inner join log_root AS log_root2 ON log_root2.root_fingerprint = log_root.root_fingerprint inner join log_root AS log_root3 ON log_root3.root_fingerprint = log_root.root_fingerprint WHERE log_root.log_fingerprint = log.fingerprint and log_root2.log_fingerprint = log2.fingerprint and log_root3.log_fingerprint = log3.fingerprint), log.description AS d, log2.description AS d2, log3.description AS d3 FROM log inner join log AS log2 inner join log AS log3 WHERE log.checked and log2.checked and log3.checked and log.fingerprint >= log2.fingerprint and log2.fingerprint >= log3.fingerprint group by (log.fingerprint || log2.fingerprint || log3.fingerprint)")[0];
    }
    return null;
  }

  getIntersectionsStatement(mask, params){
    return this.db.prepare("SELECT fingerprint, der, 1 as logs FROM (SELECT root.*, count(distinct log.fingerprint) AS degree FROM log left join log_root ON log.fingerprint = log_root.log_fingerprint left join root ON root_fingerprint = root.fingerprint WHERE log.fingerprint in (" + mask + ") group by root.fingerprint) AS all_roots WHERE degree=?", params);
  }

  getComplementStatement(mask, params){
    return this.db.prepare("SELECT fingerprint, der, logs FROM (SELECT root.*, count(distinct log.fingerprint) AS degree, GROUP_CONCAT(DISTINCT log.description) AS logs FROM log left join log_root ON log.fingerprint = log_root.log_fingerprint left join root ON root_fingerprint = root.fingerprint WHERE log.fingerprint in (" + mask + ") group by root.fingerprint) AS all_roots WHERE degree<?", params);
  }

  getFrequencyStatement(frequency){
    return this.db.prepare("SELECT * FROM (SELECT root.fingerprint, root.der, COUNT(DISTINCT log_fingerprint) AS rank, GROUP_CONCAT(log.description, ', ') as logs FROM log LEFT JOIN log_root AS lr ON lr.log_fingerprint = log.fingerprint LEFT JOIN root ON root_fingerprint = root.fingerprint WHERE checked = 1 GROUP BY root_fingerprint) WHERE rank = ?", [frequency])
  }

  getFrequencyDistributionStatement(){
    return this.db.prepare("WITH RECURSIVE generate_series(rankx) AS (SELECT 1 UNION ALL SELECT rankx+1 FROM generate_series WHERE rankx+1<= (SELECT count(*) from log where checked=1)) SELECT * FROM generate_series LEFT JOIN (SELECT COUNT(DISTINCT root_fingerprint) AS roots,  GROUP_CONCAT(DISTINCT root_fingerprint) as list, rank FROM (SELECT root_fingerprint, COUNT(DISTINCT log_fingerprint) as rank FROM log LEFT JOIN log_root AS lr ON lr.log_fingerprint = log.fingerprint WHERE checked = 1 GROUP BY root_fingerprint) AS a GROUP BY rank) AS b ON generate_series.rankx=b.rank")
  }

  getUnionStatement(){
    return this.db.prepare("SELECT root.fingerprint, root.der FROM root LEFT JOIN log_root ON log_root.root_fingerprint = root.fingerprint LEFT JOIN log ON log.fingerprint = log_fingerprint WHERE log.checked = 1 GROUP BY root_fingerprint")
  }

  logSetChecked(logFingerprint, checked = true){
    try {
      this.db.run("UPDATE log SET checked = ? WHERE fingerprint = ?",
      [checked, logFingerprint]);
    } catch (error) { return error }
  }

  //Update number of roots for a log (number of certificates in a JSON response)
  updateLogRootCountJSON(logFingerprint, rootCountJSON){
    try {
      this.db.run("UPDATE log SET root_count_json = ? WHERE fingerprint = ?",
      [rootCountJSON,
        logFingerprint
      ]);
    } catch (error) { return error }
  }

  getSelectedLogDescriptions(separator = ", "){
    switch (separator){
      case ", ":
      case " ∪ ": break;
      default: throw "Bad separator argument; aborting the query";
    } 
    return this.db.exec("SELECT GROUP_CONCAT(description, '"+ separator +"') FROM log WHERE checked=1")[0].values[0][0]
  }

  insertRootCertificate(fingerprint, der){
    try {
      this.db.run("INSERT INTO root (fingerprint, der) VALUES (?,?)",
      [fingerprint,
        der
      ]);
    } catch (error) { return error }
  }

  //Insert log-root relationship
  insertLogRoot(logFingerprint, rootFingerprint){
    try {
      this.db.run("INSERT INTO log_root (log_fingerprint, root_fingerprint) VALUES (?,?)",
      [logFingerprint,
        rootFingerprint
      ]);
    } catch (error) { return error }
  }

  insertLog(logObj){
    try {
      this.db.run("INSERT INTO log (fingerprint, description, key, url, mmd) VALUES (?,?,?,?,?)",
      [logObj.fingerprint,
        logObj.description,
        logObj.key,
        logObj.url,
        logObj.maximum_merge_delay
      ]);
    } catch (error) { return error }
  }

  logSetDisqualifiedAt(logFingerprint, disqualified_at){
    try {
      this.db.run("UPDATE log SET disqualified_at = ? WHERE fingerprint = ?",
      [disqualified_at,
        logFingerprint
      ]);
    } catch (error) { return error }
  }

  insertLogList(logFingerprint, logListName){
    try {
      this.db.run("INSERT INTO log_list (fingerprint, log_list) VALUES (?,?)",
      [logFingerprint,
        logListName
      ]);
    } catch (error) { return error }
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
