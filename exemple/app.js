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
var conf = {
    //demojs demojs@aksalj.me
    //DemoPassword
    debug: true,
    key:"cq4aoP7ROjqsosMYrP2Btftbm4TzHLoK",
    secret:"O6SQHlUHbIEhINtyUJxRTkCdqvw="
};

var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var PesaPal = require('../lib/pesapal');

PesaPal.initialize(conf);

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/payment_listener', PesaPal.listen, function (req, res) {
    var pesapal = req.pesapal;
    require('util').inspect(pesapal);
});

app.get('/payment_status', function (req, res) {
    var options = {
        reference: "001",
        transaction: "175c6485-0948-4cb9-8d72-05a2c3f25be5"
    };

    PesaPal.paymentStatus(options, function(error, status) {
        res.send({error: error, status: status});
    });
});

app.get('/payment_details', function (req, res) {
    var options = {
        reference: "001",
        transaction: "175c6485-0948-4cb9-8d72-05a2c3f25be5"
    };

    PesaPal.paymentDetails(options, function (error, payment) {
        res.send({error: error, payment: payment});
    });

});

app.get('/checkout', function (req, res, next) {

    // TODO: Render checkout UI
    fs.readFile(__dirname + '/view/checkout.html', 'utf8', function(err, text){
        res.send(text);
    });

});

app.post('/checkout', function (req, res, next) {
    // TODO: Make order from request;
    var customer = new PesaPal.Customer(req.body.email, "");
    customer.firstName = req.body.first_name;
    customer.lastName = req.body.last_name;
    var order = new PesaPal.Order(
        req.body.reference,
        customer,
        req.body.description,
        req.body.amount,
        "KES",
        req.body.type);



    if(req.body.payment == "external") { // Redirect to PesaPal for payment

        var paymentURI = PesaPal.getPaymentURL(order, "http://localhost:3000/");
        res.redirect(paymentURI);

    } else if(req.body.payment == "internal") { // Use Custom Payment Page
        PesaPal.makeOrder(order, PesaPal.PaymentMethod.MPesa, function (error, order) {

            // TODO: Save order in DB

            // TODO: Render UI to get mpesa transaction code or card details from user
            res.send(order);

        });
    }
});

app.post('/pay', function (req, res, next) {

    // TODO: Retrieve order from DB
    var order = sampleOrder();
    order.payment = {
        method: PesaPal.PaymentMethod.MPesa,
        account: "78768234"
    };

    var callback = function (error, status) {
        // TODO: Render Success / Error UI
        res.send({error:error, status:status});
    };

    switch (order.payment.method) {
        case PesaPal.PaymentMethod.MPesa:
        case PesaPal.PaymentMethod.Airtel:
            PesaPal.payMobileOrder(order, callback, req.body.phone, req.body.code);
            break;
        case PesaPal.PaymentMethod.Visa:
        case PesaPal.PaymentMethod.MasterCard:
            PesaPal.payCreditCardOrder(order, callback,
                req.body.holder, req.body.number, req.body.cvv,
                req.body.month, req.body.year, req.body.country,
                req.body.country_code, req.body.phone);
            break;
        default :
            // Error ?
            res.send("Error");

    }

});

app.listen(3000);