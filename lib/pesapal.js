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

var DEBUG = true;


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

exports.initialize = function(options) {

    options = options || {}; // TODO: See https://github.com/rjrodger/parambulator

    DEBUG = options.debug || false;
    core.init(options.key, options.secret, DEBUG);
};

/**
 * Instant Payment Notification Middleware.
 * Parses PesaPal notification and fetches payment status
 * @param req
 * @param res
 * @param next
 */
exports.listen = function (req, res, next) {

    var cb = function (err, payment) {
        req.pesapal = {
            error: err,
            payment: payment
        };
        next(req, res);
    };

    var options = {
        type: req.query(core.SUPPORTED_DATA_KEYS.type), // PesaPal seems to always expect 'CHANGE'
        transaction: req.query(core.SUPPORTED_DATA_KEYS.transaction),
        reference: req.query(core.SUPPORTED_DATA_KEYS.reference)
    };

    core.fetchPayment(options, cb);
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
 *
 * @param order
 * @param callback
 * @param method
 */
exports.makeMobileOrder = function(order, callback, method) {
    if(!method) method = core.SUPPORTED_PAYMENT_METHODS[1]; // Mpesa
    // TODO: Validate method as a mobile  method
    core.prepareOrder(order, method, callback)
};

/**
 *
 * @param order
 * @param callback
 * @param method
 */
exports.makeCreditCardOrder = function(order, callback, method) {
    if(!method) method = core.SUPPORTED_PAYMENT_METHODS[3]; // Visa
    // TODO: Validate method as a credit card method
    core.prepareOrder(order, method, callback);
};



/**
 * Pay a prepared order
 * @param order Order
 * @param callback
 * @param code string
 * @param card {{holder: string, number: string, cvv: string, expires: string}}
 */
exports.payOrder = core.submitPayment;

/**
 *
 * @param order
 * @param callback
 * @param phone
 * @param code
 */
exports.payMobileOrder = function(order, callback, phone, code) {
    core.submitPayment(order, callback, {code:code, phone:phone}, null);
};


/**
 *
 * @param order
 * @param callback
 * @param cardHolderFirstName
 * @param cardHolderLastName
 * @param cardNumber
 * @param cardSecurityCode
 * @param cardExpirationMonth
 * @param cardExpirationYear
 * @param cardHolderCountryISO string e.g. KE, CD
 * @param cardHolderCountryCode string e.g. 254, 243
 * @param cardHolderPhone
 * @param cardHolderEmail
 */
exports.payCreditCardOrder = function (order, callback,
                                       cardHolderFirstName, cardHolderLastName, cardNumber,
                                       cardSecurityCode, cardExpirationMonth, cardExpirationYear,
                                       cardHolderCountryISO, cardHolderCountryCode, cardHolderPhone, cardHolderEmail) {
    var card = {
        firstName: cardHolderFirstName,
        lastName: cardHolderLastName,
        number: cardNumber,
        cvv: cardSecurityCode,
        expirationMonth: cardExpirationMonth,
        expirationYear: cardExpirationYear,
        country: cardHolderCountryISO,
        countryCode: cardHolderCountryCode,
        email: cardHolderEmail,
        phone: cardHolderPhone
    };
    core.submitPayment(order, callback, null, card);
};