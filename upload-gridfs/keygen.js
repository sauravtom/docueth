/*Creates Public-Private keypair and saves it to "keys" folder.
User can copy the contents of the keys/pubkey.pem and send it to sender*/
'use strict';

var PromiseA = require('bluebird').Promise;
var fs = PromiseA.promisifyAll(require('fs'));
var path = require('path');
var ursa = require('ursa');
var mkdirpAsync = PromiseA.promisify(require('mkdirp'));

function keypair(pathname) {
  var key = ursa.generatePrivateKey(1024, 65537);
  var privpem = key.toPrivatePem();
  var pubpem = key.toPublicPem();
  var privkey = path.join(pathname, 'privkey.pem');
  var pubkey = path.join(pathname, 'pubkey.pem');

  return mkdirpAsync(pathname).then(function () {
    return PromiseA.all([
      fs.writeFileAsync(privkey, privpem, 'ascii')
    , fs.writeFileAsync(pubkey, pubpem, 'ascii')
    ]);
  }).then(function () {
    return key;
  });
}

PromiseA.all([
  keypair('keys')
]).then(function (keys) {
  console.log('generated %d keypairs', keys.length);
});
