var crypto = require('crypto');

var len = 128,
    iterations = 12000;

exports.hash = function(pwd, salt, fn) {
    crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash) {
        fn(err, (new Buffer(hash, 'binary')).toString('base64'));
    });
};

exports.token = function(fn) {
    crypto.randomBytes(len, function(err, bytes) {
        if (err) return fn(err);
        fn(err, bytes.toString('base64'));
    });
};