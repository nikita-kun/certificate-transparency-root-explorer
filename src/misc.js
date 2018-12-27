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

function rowToObject(values, columns){

  var obj = {};
  
  for (var i = 0; i < values.length; i++){
    obj[columns[i]] = values[i];
  }

  return obj;
}


function resultToHashtable(result, keyName){

  var obj = {}

  if (typeof result == 'undefined' || typeof result.values == 'undefined')
  return obj;

  var key = result.columns.indexOf(keyName)

  for (var i = 0; i < result.values.length; i++){
    obj[result.values[i][key]] = rowToObject(result.values[i], result.columns);
  }

  return obj;
}
