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

var sampleOrder = function () {
    var customer = new PesaPal.Customer("kaka@pesapal.com");
    customer.firstName = "Kambale";
    customer.lastName = "Kakule";
    var order = new PesaPal.Order("14-dwefew-4243r", customer, "45 Kg Maziwa");
    order.amount = 150.55;

    /*var item_one = new PesaPal.Item("sku-de98798", 23, 45.5, "Maziwa");
    var item_two = new PesaPal.Item("sku-de9879d8", 18, 35.5, "Maziwa baridi");
    order.addItem(item_one);
    order.addItem(item_two);*/
    return order;
};

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/payment_listener', PesaPal.listen, function (req, res) {
    var pesapal = req.pesapal;
    require('util').inspect(pesapal);
});

app.get('/payment_info', function (req, res) {
    var options = {
        reference: "DJELK#E@",
        transaction: "tghjk7689p0"
    };

    //PesaPal.paymentStatus(options, function(error, status) {
    //    res.send({options: options, error: error, status: status});
    //});

    PesaPal.paymentDetails(options, function (error, payment) {
        res.send({options: options, error: error, payment: payment});
    });

});

app.get('/checkout', function (req, res, next) {

    // TODO: Render checkout UI
    fs.readFile(__dirname + '/view/checkout.html', 'utf8', function(err, text){
        res.send(text);
    });

});

app.post('/checkout', function (req, res, next) {
    // TODO: Make order from request; redirect to PesaPal for payment or playaround with pesapal html
    var order = sampleOrder();


    if(req.body.payment == "external") {
        var paymentURI = PesaPal.getPaymentURL(order, "http://localhost:3000/");
        res.redirect(paymentURI);
    } else if(req.body.payment == "internal") {
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
    };

    switch (order.payment.method) {
        case PesaPal.PaymentMethod.MPesa:
        case PesaPal.PaymentMethod.Airtel:
            var code = "EDWDWDWQD"; // From post body
            PesaPal.makeOrder(order, callback, code, null);
            break;
        case PesaPal.PaymentMethod.BankCard:
            var card = { // From post body
                holder: "John Doe",
                number: "421000000000212",
                cvv: "456",
                expires: "09/18"
            };

            PesaPal.makeOrder(order, callback, null, card);
            break;
        default :
            // Error ?
            res.send("Error");

    }

});

app.listen(3000);