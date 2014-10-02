/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : app
 *  Date : 10/2/14 9:56 AM
 *  Description :
 *
 */

var express = require('express');
var PesaPal = require('../lib/pesapal');

var app = express();


app.get('/ipn_listener', PesaPal.parsePaymentNotification, function (req, res) {
    var pesapal = req.pesapal;
    require('util').inspect(pesapal);
});

app.get('/checkout/:type(internal|external)', function (req, res, next) {

    switch (req.params.type) {
        case "internal":
            // TODO: Show checkout UI, and post to PesaPal and parse the response

            break;
        case "external":
            // TODO: Show checkout UI that will post to PesaPal


            break;
    }
});


app.post('/checkout', function (req, res, next) {
    // TODO: Po
});

app.listen(3000);