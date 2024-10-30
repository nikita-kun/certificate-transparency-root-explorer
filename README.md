# Certificate Transparency Root Explorer
Explore and compare certificate root stores [ONLINE](https://nikita-kun.github.io/certificate-transparency-root-explorer/)

## Supplied root stores @ October, 2024
### Browser vendors
- Apple
- Microsoft
- Mozilla

### Certificate Transparency Logs @ Live scan
- Cloudflare
- DigiCert
- Google
- Let's Encrypt
- Sectigo
- TrustAsia

## Research paper available
Nikita Korzhitskii and Niklas Carlsson, **Characterizing the Root Landscape of Certificate Transparency Logs**, IFIP Networking, Paris, France, 2020, URL: [https://arxiv.org/abs/2001.04319](https://arxiv.org/abs/2001.04319)
```
@INPROCEEDINGS{ctroots,
  author={Korzhitskii, Nikita and Carlsson, Niklas},
  booktitle={Proc. 2020 IFIP Networking}, 
  title={Characterizing the Root Landscape of Certificate Transparency Logs}, 
  year={2020}
}
```

## AT YOUR OWN RISK
Information reported by CCADB, collected manually, or from third-party sources might be imprecise. 
Some root stores contain revoked, previously-included, and explicitly disabled certificates. All of these continue to be logged by CT. 
Ensure direct verification of the root-stores within the OS/browser of interest.
Some root stores might be unavailable for live scanning unless the default security policy of your browser is modified.
See browser console for debug output.

### Database
SQLite database of logs and roots can be imported and exported.
Direct access in the browser console via _RootExplorer.db_ object:
```
RootExplorer.db.db.exec("SELECT * FROM log");
```
