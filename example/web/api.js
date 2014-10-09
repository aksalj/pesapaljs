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

exports = module.exports = function (app, PesaPal) {

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

    app.post('/payment_url', function (req, res) {
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

        var paymentURI = PesaPal.getPaymentURL(order, req.body.callback);
        res.send({url:paymentURI});
    });

};