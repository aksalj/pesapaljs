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

var models = require('./internal/models');
var core = require('./internal/core');
var URI = require('URIjs');

/* Models */
exports.Customer = models.Customer;
exports.Order = models.Order;
exports.Item = models.Item;
exports.PaymentMethod = {
    PesaPal: core.SUPPORTED_PAYMENT_METHODS[0],
    MPesa: core.SUPPORTED_PAYMENT_METHODS[1],
    Airtel: core.SUPPORTED_PAYMENT_METHODS[2],
    Visa: core.SUPPORTED_PAYMENT_METHODS[3],
    MasterCard: core.SUPPORTED_PAYMENT_METHODS[4]
};
exports.PaymentStatus = {
    COMPLETED: "COMPLETED",
    PENDING: "PENDING",
    FAILED: "FAILED"
};

exports.Card = models.Card;
exports.MobileMoney = models.MobileMoney;

/**
 * Init the module
 * @param options {{debug: boolean, key: string, secret: string}}
 */
exports.initialize = function(options) {

    options = options || {}; // TODO: See https://github.com/rjrodger/parambulator

    if (!options.key || !options.secret) throw new Error("Need to specify both consumer key and secret");

    var debug = options.debug || false;
    core.setup(options.key, options.secret, debug);
};

/**
 * Get payment listener middleware for express.
 *
 */

exports.paymentListener = function (req, res, next) {

    var options = {
        type: "CHANGE", // PesaPal Always Seems to Want CHANGE
        transaction: req.query[core.SUPPORTED_DATA_KEYS['transaction']],
        reference: req.query[core.SUPPORTED_DATA_KEYS['reference']],
        statusOnly: false
    };

    core.fetchPayment(options, function(err, payment) {
        // See http://developer.pesapal.com/how-to-integrate/ipn
        if(!err) {
            req.payment = payment;
            res.status(200).send(new URI(req.originalUrl).query());
        } else {
            req.payment = null;
            res.status(500).send(null);
        }
        next();
    });
};

/**
 * Get the status of a payment
 * @param options {{reference: string, transaction: string}}
 * @param callback
 */
exports.paymentStatus = function (options, callback) {
    options.statusOnly = true;
    options.type = null;
    core.fetchPayment(options, callback);
};

/**
 * Get details of a payment
 * @param options {{reference: string, transaction: string}}
 * @param callback
 */
exports.paymentDetails = function (options, callback) {
    options.statusOnly = false;
    options.type = null;
    core.fetchPayment(options, callback);
};


/**
 * Get the URL for the PesaPal payment page
 * @param order
 * @param callbackURI
 * @returns string
 */
exports.getPaymentURL = function (order, callbackURI) {

    if(!order) throw new Error("No order specified");
    if(order.items.length == 0 && order.amount == 0) throw new Error("An order must have at least one(1) item");

    return core.generateSignedPaymentURL(order, callbackURI);
};


/**
 * Prepare an order
 * @param order Order
 * @param paymentMethod PaymentMethod
 * @param callback
 */
exports.makeOrder = core.prepareOrder;

/**
 * Pay a prepared order
 * @param order Order
 * @param callback
 * @param mobile MobileMoney
 * @param card Card
 */
exports.payOrder = core.submitPayment;

/* Utils */

/**
 * Utility to help not remember PesaPal's long HTTP query keys
 * @param key string {type | transaction | reference }
 * @returns {*}
 */
exports.getQueryKey = function (key) {
    if(core.SUPPORTED_DATA_KEYS.hasOwnProperty(key)) {
        return core.SUPPORTED_DATA_KEYS[key];
    } else {
        return null;
    }
};