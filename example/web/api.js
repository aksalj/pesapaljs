/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : api
 *  Date : 10/9/14 4:46 PM
 *  Description :
 *
 */
var db = require("./database");

exports = module.exports = function (app, PesaPal) {

    var readOrder = function (req) {
        // TODO: Make order from request;
        var customer = new PesaPal.Customer(req.body.email, req.body.phone);
        customer.firstName = req.body.firstName;
        customer.lastName = req.body.lastName;
        return new PesaPal.Order(
            req.body.reference,
            customer,
            req.body.description,
            req.body.amount,
            req.body.currency,
            req.body.type
        );
    };

    app.get('/payment_status', function (req, res) {
        var options = {};
        if(req.query.reference) options.reference = req.query.reference;
        if(req.query.transaction) options.transaction = req.query.transaction;

        PesaPal.getPaymentStatus(options)
            .then(function (status) { res.send({reference: options.reference, status: status}); })
            .catch(function (error) { res.status(500).send(error); });

    });

    app.get('/payment_details', function (req, res) {
        var options = {};
        if(req.query.reference) options.reference = req.query.reference;
        if(req.query.transaction) options.transaction = req.query.transaction;


        PesaPal.getPaymentDetails(options)
            .then(function (payment) { res.send(payment); })
            .catch(function (error) { res.status(500).send(error); });

    });

    app.post('/make_order', function (req, res) {
        var order = readOrder(req);
        var method = null;
        switch (req.body.method) {
            case "mpesa":
                method = PesaPal.PaymentMethod.MPesa;
                break;
            case "airtel":
                method = PesaPal.PaymentMethod.Airtel;
                break;
            case "visa":
                method = PesaPal.PaymentMethod.Visa;
                break;
            case "mastercard":
                method = PesaPal.PaymentMethod.MasterCard;
                break;
            default:
                res.status(500).send("Unsupported payment method");
                return;
        }

        PesaPal.makeOrder(order, method)
            .then(function (order) {

                // Save order
                db.saveOrder(order);

                res.send({reference: order.reference});

            })
            .catch(function(error) {
                res.send(error.message);
            });
    });

    app.post("/pay_order", function (req, res) {
        // Retrieve order
        var order = db.getOrder(req.body.reference);

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
            PesaPal.payOrder(order, paymentData)
                .then(function (paymentResponse) {res.send(paymentResponse); })
                .catch(function (error) { res.status(500).send(error.message); });

        } else {
            res.status(500).send("Error!!!");
        }

    });

    app.post('/payment_url', function (req, res) {
        var order = readOrder(req);
        var paymentURI = PesaPal.getPaymentURL(order, req.body.callback);
        res.send({url:paymentURI});
    });

};