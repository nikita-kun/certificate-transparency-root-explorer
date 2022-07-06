# Certificate Transparency Root Explorer
[Online Demo](https://nikita-kun.github.io/certificate-transparency-root-explorer/)

A tool for exploring certificate stores.
Visualize, compare, parse, search, and export certificate information from the root stores.
An SQLite database of logs and roots can be imported and exported.
CT logs can be scanned online.

## Supplied root stores (Latest snapshot: May 7th, 2021):
- Mozilla
- Microsoft
- Apple
- and available Certificate Transparency Logs.

## Research paper available
Nikita Korzhitskii and Niklas Carlsson, **Characterizing the Root Landscape of Certificate Transparency Logs**, IFIP Networking, Paris, France, 2020, URL: https://arxiv.org/abs/2001.04319
```
@INPROCEEDINGS{ctroots,
  author={Korzhitskii, Nikita and Carlsson, Niklas},
  booktitle={Proc. 2020 IFIP Networking}, 
  title={Characterizing the Root Landscape of Certificate Transparency Logs}, 
  year={2020},
  url={https://arxiv.org/abs/2001.04319}
}
```

## AT YOUR OWN RISK:
By default, only logs by Google, Let's Encrypt, and Trust Asia are available for live log scanning. The rest of the logs have not explicitly configured response headers related to the CORS policy. Some unavailable logs can be scanned after switching off CORS same-origin policy and/or other security features of your browser, such as certificate verification. **Disabling security features of your browser must only be done in a safe environment.**

Debug output can be found in the browser console.

### Running locally
Clone the application and open index.html in your Chrome/Chromium browser
```
chromium-browser index.html
```

### Testing
Unit tests are available in test.html
```
chromium-browser test.html
```
### Querying the database
Database of root stores can be accessed through the browser console and _RootExplorer.db_ object.
```
RootExplorer.db.db.exec("SELECT * FROM log");
```
