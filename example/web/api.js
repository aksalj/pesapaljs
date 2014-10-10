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
        var order = new PesaPal.Order(
            req.body.reference,
            customer,
            req.body.description,
            req.body.amount,
            req.body.currency,
            req.body.type);

        return order;
    };

    app.get('/payment_status/:reference', function (req, res) {
        var options = {
            reference: req.params.reference
        };

        PesaPal.paymentStatus(options, function(error, status) {
            if(error) {
                res.status(500).send(error);
            } else {
                res.send({reference: options.reference, status: status});
            }
        });
    });

    app.get('/payment_details/:reference', function (req, res) {
        var options = {
            reference: req.params.reference
        };

        PesaPal.paymentDetails(options, function (error, payment) {
            if(error) {
                res.status(500).send(error);
            } else {
                res.send(payment);
            }
        });

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

        PesaPal.makeOrder(order, method, function (error, order) {
            // Save order
            db.saveOrder(order);

            if(error) {
                res.status(500).send(error.message);
            } else {
                res.send({reference: order.reference});
            }
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
            PesaPal.payOrder(order, paymentData, function (error, reference, transactionId) {
                if(error) {
                    res.status(500).send(error.message);
                } else {
                    res.send({reference: reference, transaction: transactionId});
                }
            });
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