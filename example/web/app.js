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
var morgan = require('morgan');
var bodyParser = require('body-parser');
var loremIpsum = require('lorem-ipsum');
var api = require('./api');
var db = require("./database");
var PesaPal = require('../../lib/pesapal').init({
    debug: true,
    key: "s9wWRUjVSuzqvZIoVDzxOsjgNdmWwoAR", // TODO: Use your own credentials!!
    secret: "fe9iGVCH8YkJGL9G5V1epBh7zrQ="
});

var app = express();
app.use(morgan('dev'));

app.set('views', __dirname + '/view');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));

// Serve our android app
api(app, PesaPal);

app.use("/static", express.static(__dirname + "/static"));

app.get('/payment_listener', PesaPal.paymentListener, function (req) {
    var payment = req.payment;
    if (payment) {
        // TODO: Save in DB?
    }
});

app.get('/payment_callback', function (req, res) {
    var options = { // Assumes pesapal calls back with a transaction id and reference
        transaction: req.query[PesaPal.getQueryKey('transaction')],
        reference: req.query[PesaPal.getQueryKey('reference')]
    };

    PesaPal.getPaymentDetails(options)
        .then(function (payment) {
            // check payment.status and proceed accordingly

            var message = "Thank you for doing business with us.";
            res.render("message", {
                message: message,
                details: JSON.stringify(payment, null, 2)
            });

        })
        .catch(function(error) {
            var message = "Oops! Something went wrong";
            res.render("message", {
                message: message,
                error: JSON.stringify(error, null, 2)
            });
        });

});

app.get('/', function (req, res, next) {
    // TODO: Render checkout UI
    res.render("checkout", {
        reference: new Date().getTime(),
        description: loremIpsum(),
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
        req.body.currency,
        req.body.type);


    if(req.body.pesapal) { // Redirect to PesaPal for payment

        var paymentURI = PesaPal.getPaymentURL(order, "http://localhost:3000/payment_callback");
        res.redirect(paymentURI);

    } else { // Use Custom Payment Page

        var mobilePayment = req.body.mobile != undefined;
        var method = mobilePayment ? PesaPal.PaymentMethod.MPesa : PesaPal.PaymentMethod.Visa;

        PesaPal.makeOrder(order, method)
            .then(function (order) {

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

            })
            .catch(function(error) {
                res.send(error.message);
            });
    }
});

app.post('/pay', function (req, res, next) {

    // TODO: Retrieve order from DB
    var order = db.getOrder(req.body.reference);

    var processResponse = function (paymentResponse) {
        // TODO: Render Success / Error UI
        // TODO: Save transaction id for conformation when I get an IPN? Or check payment status right now?

        PesaPal.getPaymentDetails(paymentResponse)
            .then(function (payment){
                // check payment.status and proceed accordingly

                var message = "Thank you for doing business with us.";
                res.render("message", {
                    message: message,
                    details: JSON.stringify(payment, null, 2)
                });
            })
            .catch(function(error){
                var message = "Oops! Something bad happended!";
                res.render("message", {
                    message: message,
                    error: JSON.stringify(error, null, 2)
                });
            });


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
            paymentData.number = req.body.number.replace(/ /g, "");
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
        PesaPal.payOrder(order, paymentData)
            .then(processResponse)
            .catch(function (error) {
                res.send(error.toString());
            });

    } else {
        res.render("message", {message: "Error!!!"});
    }

});

app.listen(3000, () => console.log("App running on localhost:3000"));