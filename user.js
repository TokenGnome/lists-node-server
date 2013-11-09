var client = require('./database').client,
    Creds = require('./creds'),
    SALT = 'SALT';

var findById = module.exports.findById = function User_findById(uid, fn) {
    client.hgetall('user:' + uid, function(err, user) {
        if (err) {
            if (fn) fn(err, null);
        } else if (user) {
            if (fn) fn(err, new User(user));
        } else {
            if (fn) fn(new Error('Invalid user id'), null);
        }
    });
};

var findByName = module.exports.findByName = function User_findByName(name, fn) {
    client.get('username.to.id:' + name, function(err, uid) {
        if (err) {
            if (fn) fn(err, null);
        } else if (uid) {
            findById(uid, fn);
        } else {
            if (fn) fn(new Error('Invalid username'), null);
        }
    });
};

var findByToken = module.exports.findByToken = function User_findByToken(token, fn) {
    client.get('token.to.id:' + token, function(err, uid) {
        if (err) {
            if (fn) fn(err, null);
        } else if (uid) {
            findById(uid, fn);
        } else {
            if (fn) fn(new Error('Invalid token'), null);
        }
    });
};

var User = module.exports.User = function(u) {
    u = u || {};
    var self = this;
    self.id = u.id || 0;
    if (u.name) self.name = u.name;
    if (u.token) self.token = u.token;
    if (u.password) self.password = u.password;
    if (u.created) self.createdOn = u.created;
    if (u.updated) self.updatedOn = u.updated;
    return this;
};

User.prototype.save = function(fn) {
    var self = this,
        multi = client.multi();
    if (self.id < 1) {
        fn(new Error('Invalid user id'));
        return this;
    }
    multi.hset('user:' + self.id, 'id', self.id);
    if (self.name) {
        multi.hset('user:' + self.id, 'name', self.name);
        multi.set('username.to.id:' + self.name, self.id);
    }
    if (self.token) {
        multi.hset('user:' + self.id, 'token', self.token);
        multi.set('token.to.id:' + self.token, self.id);
    }
    if (self.password) multi.hset('user:' + self.id, 'password', self.password);
    if (self.createdOn) multi.hset('user:' + self.id, 'created', self.createdOn);
    if (self.updatedOn) multi.hset('user:' + self.id, 'updated', self.updatedOn);
    multi.exec(function(err) {
        if (err) throw err;
        if (fn) fn(err, self);
    });
    return this;
};

module.exports.create = function User_create(un, pw, fn) {
    client.exists('username.to.id:' + un, function(err, exists) {
        if (err) throw err;
        if (exists) {
            var e = new Error('Username already in use');
            e.status = 409;
            return fn(e, null);
        }
        var user = new User();
        user.name = un;
        client.incr('global:nextUserId', function(err, uid) {
            user.id = uid;
            user.createdOn = user.updatedOn = new Date();
            Creds.hash(pw, SALT, function(err, hash) {
                if (err) throw err;
                user.password = hash;
                Creds.token(function(err, token) {
                    if (err) throw err;
                    user.token = token;
                    user.save(function(err) {
                        if (err) return fn(err, null);
                        if (fn) fn(err, user);
                    });
                });
            });
        });
    });
};

module.exports.delete = function User_delete(uid, fn) {
    findById(uid, function(err, user) {
        client.multi()
            .del('user:' + user.id)
            .del('username.to.id:' + user.name)
            .del('token.to.id:' + user.token)
        .exec(fn);
    });
};

module.exports.authenticate = function User_authenticate(un, pw, fn) {
    findByName(un, function(err, user) {
        if (err || !user) return fn(err, null);
        Creds.hash(pw, SALT, function(err, hashed) {
            if (err) throw err;
            if (hashed === user.password) {
                fn(err, user);
            } else {
                fn(err, null);
            }
        });
    });
};

