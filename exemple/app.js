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
var PesaPal = require('../lib/pesapal');

var conf = {
    //demojs demojs@aksalj.me
    //DemoPassword
    debug: true,
    key:"cq4aoP7ROjqsosMYrP2Btftbm4TzHLoK",
    secret:"O6SQHlUHbIEhINtyUJxRTkCdqvw="
};

PesaPal.initialize(conf);

var app = express();

var DB = function() {
    var orders = {};
    this.set = function (key, order) {
        orders[key] = order;
    };

    this.get = function(key) {
        if(orders.hasOwnProperty(key)){
            return orders[key];
        }
        return null;
    };
};
var db = new DB();

app.set('views', __dirname + '/view');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/static", express.static(__dirname + "/static"));

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



    if(req.body.payment == "external") { // Redirect to PesaPal for payment

        var paymentURI = PesaPal.getPaymentURL(order, "http://localhost:3000/");
        res.redirect(paymentURI);

    } else if(req.body.payment == "internal") { // Use Custom Payment Page

        var mobilePayment = req.body.method == "mobile";
        var method = mobilePayment ? PesaPal.PaymentMethod.MPesa : PesaPal.PaymentMethod.Visa;

        PesaPal.makeMobileOrder(order, function (error, order) {

            if(error) {
                res.send(error.message);
            } else {

                // TODO: Save order in DB
                db.set(order.reference, order);

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

        }, method);
    }
});

app.post('/pay', function (req, res, next) {

    // TODO: Retrieve order from DB
    var order = db.get(req.body.reference);

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
                req.body.first_name, req.body.last_name, req.body.number,
                req.body.cvv, req.body.month, req.body.year, req.body.country,
                req.body.country_code, req.body.phone);
            break;
        default :
            // Error ?
            res.send("Error");

    }

});

app.listen(3000);