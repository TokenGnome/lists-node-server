var client = require('./database').client;

var List = module.exports.List = function(l) {
    l = l || {};
    var self = this;
    self.id = l.id || 0;
    if (l.title) self.title = l.title;
    if (l.items) self.items = l.items;
    if (l.created) self.createdOn = l.created;
    if (l.updated) self.updatedOn = l.updated;
    if (l.owner) self.ownerId = l.owner;
    return this;
};

List.prototype.save = function List_save(fn) {
    var self = this,
        multi = client.multi();

    if (self.id < 1) {
        fn(new Error('Invalid list id'));
        return this;
    }
    multi.hset('list:' + self.id, 'id', self.id);
    if (self.title) multi.hset('list:' + self.id, 'title', self.title);
    if (self.items) multi.hset('list:' + self.id, 'items', self.items);
    if (self.ownerId) multi.hset('list:' + self.id, 'owner', self.ownerId);
    if (self.createdOn) multi.hset('list:' + self.id, 'created', self.createdOn);
    if (self.updatedOn) multi.hset('list:' + self.id, 'updated', self.updatedOn);
    multi.exec(function(err) {
        if (err) {
            if (fn) fn(err, null);
        } else {
            if (fn) fn(null, self);
        }
    });
};

module.exports.findById = function _findById(lid, fn) {
    client.hgetall('list:' + lid, function(err, list) {
        if (err) {
            if (fn) fn(err, null);
        } else if (list) {
            if (fn) fn(err, new List(list));
        } else {
            if (fn) fn(new Error('Invalid list id'), null);
        }
    });
};

module.exports.create = function _create(title, oid, fn) {
    var list = new List();
    list.title = title;
    client.incr('global:nextListId', function(err, lid) {
        list.id = lid;
        list.createdOn = list.updatedOn = new Date();
        list.ownerId = oid;
        list.items = 0;
        list.save(function(err) {
            if (err) return fn(err, null);
            if (fn) fn(err, list);
        });
    });
};