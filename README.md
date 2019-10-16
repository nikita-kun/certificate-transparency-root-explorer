# Certificate Transparency Root Explorer

...is a tool for exploring certificate stores.

One can visualize intersections, compare, parse, search and export certificate information.
An SQLite database of logs and roots could be imported and exported.
CT logs could be scanned online.

## Available root stores (Snapshots from December 27th, 2018 and  October 8th, 2019):
- Mozilla
- Microsoft
- Apple
- and multiple Certificate Transparency Logs.

### Requirements:
Chrome or Chromium Browser.

By default, only logs by Google are available for live log scanning. The rest of the logs have not explicitly configured response headers related to the CORS policy.

## AT YOUR OWN RISK:
To be able to scan unavailable logs you'd have to disable CORS same-origin policy and/or other security features of your browser, such as certificate verification. **Disabling security features of your browser must only be done in a safe, non-production environment.**

Debug output could be found in the console.

### Running locally
Clone the application and open index.html in your Chrome/Chromium browser
```
chromium-browser index.html
```

### Testing
A set of tests is available for troubleshooting in test.html
```
chromium-browser test.html
```
### Querying the database
Database of root stores from live scans and snapshots can be queried via a JavaScript console and _RootExplorer.db_ object.
Log listing example:
```
RootExplorer.db.db.exec("SELECT * FROM log");
```