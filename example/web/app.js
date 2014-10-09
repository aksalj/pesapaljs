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
var bodyParser = require('body-parser');
var PesaPal = require('../../lib/pesapal');
var db = require("./database");

var conf = {
    //demojs demojs@aksalj.me
    //DemoPassword
    debug: true,
    key:"cq4aoP7ROjqsosMYrP2Btftbm4TzHLoK",
    secret:"O6SQHlUHbIEhINtyUJxRTkCdqvw="
};

PesaPal.initialize(conf);

var app = express();

app.set('views', __dirname + '/view');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/static", express.static(__dirname + "/static"));

app.get('/payment_listener', function (req, res) {
    var options = {
        transaction: req.query(PesaPal.getQueryKey('transaction')),
        reference: req.query(PesaPal.getQueryKey('reference'))
    };

    PesaPal.paymentDetails(options, function(error, payment) {
        res.send({error: error, payment: payment});
    });
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

app.get('/payment_callback', function (req, res) {
    var options = { // Assumes pesapal calls back with a transaction id and reference
        reference: req.query.pesapal_transaction_tracking_id,
        transaction: req.query.pesapal_merchant_reference
    };

    PesaPal.paymentDetails(options, function (error, payment) {
        res.send({error: error, payment: payment});
    });
});

app.get('/checkout', function (req, res, next) {
    // TODO: Render checkout UI
    res.render("checkout", {
        reference: new Date().getTime(),
        description: "Order description",
        amount: Math.floor((Math.random() * 20000) + 1)
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


    if(req.body.pesapal) { // Redirect to PesaPal for payment

        var paymentURI = PesaPal.getPaymentURL(order, "http://localhost:3000/payment_callback");
        res.redirect(paymentURI);

    } else { // Use Custom Payment Page

        var mobilePayment = req.body.mobile != undefined;
        var method = mobilePayment ? PesaPal.PaymentMethod.MPesa : PesaPal.PaymentMethod.Visa;

        PesaPal.makeOrder(order, method, function (error, order) {

            if(error) {
                res.send(error.message);
            } else {

                // TODO: Save order in DB
                db.saveOrder(order);

                // TODO: Render UI to get mpesa transaction code or card details from user
                if (mobilePayment) {
                    res.render("mobile", {
                        reference: order.reference,
                        instructions: "Send " + order.amount + " " + order.currency + " to " + method.account + " via " + method.name
                    });
                } else {
                    res.render("card", {reference: order.reference});
                }
            }

        });
    }
});

app.post('/pay', function (req, res, next) {

    // TODO: Retrieve order from DB
    var order = db.getOrder(req.body.reference);

    var callback = function (error, reference, transactionId) {
        // TODO: Render Success / Error UI
        // TODO: Save transaction id for conformation when I get an IPN
        var message = transactionId == null ? error.message : "Thank you for doing business with us.";
        res.render("message", {message: message});
    };

    var paymentData = null;

    switch (order.getPaymentMethod()) {
        case PesaPal.PaymentMethod.MPesa:
        case PesaPal.PaymentMethod.Airtel:
            paymentData = new PesaPal.MobileMoney(req.body.phone, req.body.code);
            break;
        case PesaPal.PaymentMethod.Visa:
        case PesaPal.PaymentMethod.MasterCard:
            paymentData = new PesaPal.Card();
            paymentData.firstName = req.body.first_name;
            paymentData.lastName = req.body.last_name;
            paymentData.number = req.body.number;
            paymentData.cvv = req.body.cvv;
            paymentData.expirationMonth = (req.body.expiry.split('/') [0]).trim();
            paymentData.expirationYear = (req.body.expiry.split('/') [1]).trim();
            paymentData.country = req.body.country;
            paymentData.countryCode = req.body.country_code;
            paymentData.phone = req.body.phone;
            paymentData.email = req.body.email;
            break;
        default:
            throw new Error("Invalid order");
    }

    if(paymentData != null) {
        PesaPal.payOrder(order, paymentData, callback);
    } else {
        res.render("message", {message: "Error!!!"});
    }

});

app.listen(3000);