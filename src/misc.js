function base64DecodeToBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays);
  return blob;
}


function base64sha256(b64Data){
  var Base64Sha256 = new jsSHA("SHA-256", "B64");
  Base64Sha256.update(b64Data);
  return Base64Sha256.getHash("HEX");
}

/*function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$|^\s+|\s+$/g, ''));
    return lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return headers.reduce((obj, header, i) => {
            obj[header] = values[i] ? values[i].replace(/^"|"$|^\s+|\s+$/g, '') : null;
            return obj;
        }, {});
    });
}*/

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$|^\s+|\s+$/g, ''));
    
    return lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        
        return headers.reduce((obj, header, i) => {
            obj[header] = values[i] ? values[i].replace(/^"|"$|^\s+|\s+$/g, '') : null;
            return obj;
        }, {});
    });
}

const fetchWithRetry = async (url, n=2, delaySec=15) => {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < n; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res;
        } catch (e) {
            if (i === n - 1) throw new Error(`Failed after ${n} attempts: ${e.message}`);
            await delay(delaySec*1000); // Wait for 10 seconds before retrying
        }
    }
};

Promise.allSettled = Promise.allSettled || ((promises) => Promise.all(promises.map(p => p
  .then(value => ({
    status: 'fulfilled', value
  }))
  .catch(reason => ({
    status: 'rejected', reason
  }))
)));
