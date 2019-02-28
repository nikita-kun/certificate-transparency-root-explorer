class RootExplorerDB{
  constructor(){
    this.db = new SQL.Database();
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


}
