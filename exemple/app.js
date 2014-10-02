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



app.listen(3000);