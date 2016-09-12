/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : pesapal
 *  Date : 10/2/14 8:55 AM
 *  Description :
 *
 *  See http://developer.pesapal.com/how-to-integrate/api-reference
 *
 */
'use strict';

/* */
var models = require('./internal/models');
var core = require('./internal/core');
var URI = require('urijs');

var PesaPal = {};

/* Utils */
PesaPal.Utils = require('./internal/helpers');

/* Models */
PesaPal.Customer = models.Customer;
PesaPal.Order = models.Order;
PesaPal.Item = models.Item;
PesaPal.PaymentMethod = {
    PesaPal: core.SUPPORTED_PAYMENT_METHODS[0],
    MPesa: core.SUPPORTED_PAYMENT_METHODS[1],
    Airtel: core.SUPPORTED_PAYMENT_METHODS[2],
    Visa: core.SUPPORTED_PAYMENT_METHODS[3],
    MasterCard: core.SUPPORTED_PAYMENT_METHODS[4]
};
PesaPal.PaymentStatus = {
    COMPLETED: "COMPLETED",
    PENDING: "PENDING",
    FAILED: "FAILED"
};

PesaPal.Card = models.Card;
PesaPal.MobileMoney = models.MobileMoney;

/**
 * express middleware that parses PesaPal payment notifications.
 * @param req
 * @param res
 * @param next
 */
PesaPal.paymentListener = function (req, res, next) {

    var options = {
        type: "CHANGE", // PesaPal Always Seems to Want CHANGE
        transaction: req.query[core.SUPPORTED_DATA_KEYS.transaction],
        reference: req.query[core.SUPPORTED_DATA_KEYS.reference],
        statusOnly: false
    };

    // See http://developer.pesapal.com/how-to-integrate/ipn
    core.fetchPayment(options)
        .then(function (payment) {
            req.payment = payment;
            res.status(200).send(new URI(req.originalUrl).query());
            next();
        })
        .catch(function (err) {
            req.payment = null;
            res.status(500).send(null);
            next();
        });
};


/**
 * Get the status of a payment
 * @param options {{reference: string, transaction: string}}
 * @returns {bluebird|exports|module.exports}
 */
PesaPal.getPaymentStatus = function (options) {
    options.statusOnly = true;
    options.type = null;
    return core.fetchPayment(options);
};


/**
 * Get details of a payment
 * @param options {{reference: string, transaction: string}}
 * @returns {bluebird|exports|module.exports}
 */
PesaPal.getPaymentDetails = function (options) {
    options.statusOnly = false;
    options.type = null;
    return core.fetchPayment(options);
};


/**
 * Get the URL for the PesaPal payment page
 * @param order
 * @param callbackURI
 * @returns string
 */
PesaPal.getPaymentURL = function (order, callbackURI) {

    if(!order) throw new Error("No order specified");
    if(order.items.length === 0 && order.amount === 0) throw new Error("An order must have at least one(1) item");

    return core.generateSignedPaymentURL(order, callbackURI);
};


/**
 * Prepare an order
 * @param order Order
 * @param paymentMethod PaymentMethod
 * @param callback
 */
PesaPal.makeOrder = core.prepareOrder;

/**
 * Pay a prepared order
 * @param order Order
 * @param callback
 * @param mobile MobileMoney
 * @param card Card
 */
PesaPal.payOrder = core.submitPayment;

/* Utils */

/**
 * Utility to help not remember PesaPal's long HTTP query keys
 * @param key string {type | transaction | reference }
 * @returns {*}
 */
PesaPal.getQueryKey = function (key) {
    if(core.SUPPORTED_DATA_KEYS.hasOwnProperty(key)) {
        return core.SUPPORTED_DATA_KEYS[key];
    } else {
        return null;
    }
};

/**
 * Init the module
 * @param options {{debug: boolean, key: string, secret: string}}
 */
exports.init = function(options) {

    options = options || {};

    if (!options.key || !options.secret) throw new Error("Need to specify both consumer key and secret");

    var debug = options.debug || false;
    core.setup(options.key, options.secret, debug);
    return PesaPal;
};