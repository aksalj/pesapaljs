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

var OAuth = require('oauth');
var models = require('./models');

var DEBUG = true;

/* Data Keys */
var DATA_KEYS = {
    type: "pesapal_notification_type", // for IPN only
    transaction: "pesapal_transaction_tracking_id",
    reference: "pesapal_merchant_reference",
    request: "pesapal_request_data" // for direct order only
};

/* API Endpoints */
var PAYMENT_STATUS_URL = null;
var PAYMENT_DETAILS_URL = null;
var DIRECT_ORDER_URL = null;

var CONSUMER_KEY = null;
var CONSUMER_SECRET = null;


/**
 * Get a payment information
 * @param params {{type: string, reference: string, transaction: string, statusOnly: boolean}}
 * @param callback
 */
var fetchPayment = function (params, callback) {

    params = params || {};

    var type = params.type || null;
    var reference = params.reference || null;
    var transaction = params.transaction || null;
    var statusOnly = params.status || true;

    if (!callback) throw new Error("No callback specified");
    if (!reference && !transaction) throw new Error("You must specify either a reference or a transaction or both.");

    var oauth = new OAuth.OAuth(
        null, // requestUrl
        null, // accessUrl
        CONSUMER_KEY,
        CONSUMER_SECRET,
        '1.0',
        null, // authorize_callback
        'HMAC-SHA1'
    );

    var url = PAYMENT_STATUS_URL + "?";
    if (statusOnly == false) {
        url = PAYMENT_DETAILS_URL + "?";
    }
    if (type) {
        url += DATA_KEYS.type + "=" + type + "&";
    }
    if (reference) {
        url += DATA_KEYS.reference + "=" + reference + "&";
    }
    if (transaction) {
        url += DATA_KEYS.transaction + "=" + transaction;
    }


    oauth.get(url, null, null,
        function (err, data, response) {
            if (!err) {
                // TODO: Parse data
                if (!statusOnly) {
                    // data=pesapal_transaction_tracking_id,payment_method,payment_status,pesapal_merchant_reference
                    var segments = data.split(',');
                    data = {
                        transaction: segments[0],
                        method: segments[1],
                        status: segments[2],
                        reference: segments[3]
                    };
                }
            }
            callback(err, data);
        }
    );
};

/**
 * Prepare xml to be sent as a query parameter
 * @param xml
 * @returns {*}
 */
var prepareXML = function (xml) {
    var php = require('phpjs');
    return php.htmlentities(xml).replace(/"/g, "&quot;");
};


/* Models */
exports.Customer = models.Customer;
exports.Order = models.Order;
exports.Item = models.Item;
exports.PaymentMethod = {
    PesaPal: new models.PaymentMethod("pesapal", "PesaPal", "PesaPal Account"),
    MPesa: new models.PaymentMethod("mpesa", "MPesa", "Safaricom mobile payment"),
    Airtel: new models.PaymentMethod("airtel", "Airtel Money", "Airtel mobile payment"),
    BankCard: new models.PaymentMethod("cc", "Credit / Debit Card", "")
};
exports.PaymentStatus = {
    COMPLETED: "COMPLETED",
    PENDING: "PENDING",
    FAILED: "FAILED"
};

exports.initialize = function(options) {

    options = options || {}; // TODO: See https://github.com/rjrodger/parambulator

    DEBUG = options.debug || false;
    CONSUMER_KEY = options.key || null;
    CONSUMER_SECRET = options.secret || null;

    if (!CONSUMER_KEY || !CONSUMER_SECRET) throw new Error("Need to specify both consumer key and secret");

    PAYMENT_STATUS_URL = DEBUG ? "http://demo.pesapal.com/api/querypaymentstatus" : "https://www.pesapal.com/API/QueryPaymentStatus";
    PAYMENT_DETAILS_URL = DEBUG ? "http://demo.pesapal.com/api/querypaymentdetails" : "https://www.pesapal.com/API/QueryPaymentDetails";
    DIRECT_ORDER_URL = DEBUG ? "http://demo.pesapal.com/api/postpesapaldirectorderv4" : "https://www.pesapal.com/API/PostPesapalDirectOrderV4";

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
        type: req.query(DATA_KEYS.type), // PesaPal seems to always expect 'CHANGE'
        transaction: req.query(DATA_KEYS.transaction),
        reference: req.query(DATA_KEYS.reference)
    };

    fetchPayment(options, cb);
};

/**
 * Get the status of a payment
 * @param options {{reference: string, transaction: string}}
 * @param callback
 */
exports.paymentStatus = function (options, callback) {
    options.statusOnly = true;
    options.type = null;
    fetchPayment(options, callback);
};

/**
 * Get details of a payment
 * @param options {{reference: string, transaction: string}}
 * @param callback
 */
exports.paymentDetails = function (options, callback) {
    options.statusOnly = true;
    options.type = null;
    fetchPayment(options, callback);
};


exports.getPaymentURL = function (order, callbackURI) {

    if(!order) throw new Error("No order specified");
    if(order.items.length == 0 && order.amount == 0) throw new Error("An order must have at least one(1) item");

    var OAuthSimple = require('OAuthSimple');
    var signer = new OAuthSimple(CONSUMER_KEY, CONSUMER_SECRET);
    var request = signer.sign({
        action: "GET",
        path: DIRECT_ORDER_URL,
        parameters: {
            oauth_callback: callbackURI,
            pesapal_request_data : prepareXML(order.toXML())
        }
    });

    return request.signed_url;
};

/**
 * Prepare an order
 * @param order Order
 * @param paymentMethod PaymentMethod
 * @param callback
 */
exports.makeOrder = function ( order, paymentMethod, callback ) {

    if(!order) throw new Error("No order specified");
    if(order.items.length == 0 && order.amount == 0) throw new Error("An order must have at least one(1) item");
    if(!callback) throw new Error("Callback is required");
    if(!paymentMethod) throw new Error("No payment method specified");
    if(paymentMethod.tag != "mpesa" &&
        paymentMethod.tag != "airtel" &&
        paymentMethod.tag != "cc" ) {
        throw new Error("Payment method not supported. Only MPesa, Airtel Money or Bank cards are supported");
    }

    var oauth = new OAuth.OAuth(
        null, // requestUrl
        null, // accessUrl
        CONSUMER_KEY,
        CONSUMER_SECRET,
        '1.0',
        null, // authorize_callback
        'HMAC-SHA1'
    );

    var url = DIRECT_ORDER_URL + "?" + DATA_KEYS.request + "=" + prepareXML(order.toXML());

    oauth.get(url, null, null,
        function (err, data, response) {
            if(err) {
                callback(err, null);
            } else {

                // TODO: Play around with PesaPal html based on paymentMethod
                console.log(data);

                var account = null; // Mobile Payment Business Number

                order.payment = {
                    method: paymentMethod,
                    account: account
                };

                callback(err, order);
            }
        });
};

/**
 * Pay a prepared order
 * @param order Order
 * @param callback
 * @param code string
 * @param card {{holder: string, number: string, cvv: string, expires: string}}
 */
exports.payOrder = function (order, callback, code, card ) {
    // TODO: Send mobile money code / credit card details to PesaPal

    if(!order.payment || !order.payment.method) throw new Error("Invalid/Unprepared order");

    switch (order.payment.method.tag) {
        case "cc": // Credit / Debit Card
            if(!card) throw new Error("No Card Info Supplied");
            /*
             var card = {
             holder: "John Doe",
             number: "421000000000212",
             cvv: "456",
             expires: "09/18"
             };*/
            break;
        default: // Mobile Money
            if(!code) throw new Error("No transaction code supplied");

            break;

    }

    // http://developer.pesapal.com/how-to-integrate/api-reference#PostPesapalDirectOrderV4
    callback(null, reference, transaction);

};