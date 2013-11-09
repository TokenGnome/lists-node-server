var E = require('express'),
    U = require('./user'),
    L = require('./list'),
    app = E();

var error = function _error(status, msg) {
    var err = new Error(msg);
    err.status = status;
    return err;
};

var authenticateUser = function _authenticateUser(un, pw, fn) {
    U.authenticate(un, pw, fn);
};

var createNewUser = function _createNewUser(un, pw, fn) {
    U.create(un, pw, fn);
};

var createNewList = function _createNewList(title, uid, fn) {
    L.create(title, uid, fn);
};

var loadUser = function _loadUser(req, res, next) {
    var authToken = req.get('authToken');
    if (!authToken) return next(error(400, 'Authentication token required'));
    U.findByToken(authToken, function(err, user) {
        if (err) {
            next(err);
        } else if (user) {
            req.user = user;
            next();
        } else {
            next(error(401, 'Invalid token'));
        }
    });
};

app.use(E.bodyParser());

app.use(app.router);

app.use(function(err, req, res, next) {
    res.send(err.status || 500, { error : err.message });
});

app.get('/', loadUser, function(req, res) {
    res.json(req.user);
});

app.post('/authenticate', function(req, res) {
    authenticateUser(req.body.username, req.body.password, function(err, user) {
        if (err) res.send(err.status || 500, { error: err.message });
        res.json({
            name: user.name,
            token: user.token
        });
    });
});

app.post('/signup', function(req, res) {
    createNewUser(req.body.username, req.body.password, function(err, user) {
        if (err) res.send(err.status || 500, { error : err.message });
        res.json({
            name: user.name,
            token: user.token
        });
    });
});

app.post('/lists', loadUser, function(req, res) {
    createNewList(req.body.title, req.user.id, function(err, list) {
        if (err) res.send(err.status || 500, { error : err.message });
        res.json(list);
    });
});

app.get('/lists/:lid', loadUser, function(req, res) {
    L.findById(req.params.lid, function(err, list) {
        if (err) res.send(err.status || 500, { error : err.message });
        res.json(list);
    });
});

app.listen(3000);