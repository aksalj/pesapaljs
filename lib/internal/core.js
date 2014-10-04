/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : requester
 *  Date : 10/2/14 8:55 AM
 *  Description :
 *
 */
var OAuthSimple = require('oauthsimple');
var request = require('request');
var PesaPalScraper = require('./internal/scraper');

/* Data Keys */
var DATA_KEYS = {
    type: "pesapal_notification_type", // for IPN only
    transaction: "pesapal_transaction_tracking_id",
    reference: "pesapal_merchant_reference",
    request: "pesapal_request_data", // for direct order only
    response: "pesapal_response_data"
};
exports.SUPPORTED_DATA_KEYS = DATA_KEYS;

/* API Endpoints */
var PAYMENT_STATUS_URL = null;
var PAYMENT_DETAILS_URL = null;
var DIRECT_ORDER_URL = null;

var CONSUMER_KEY = null;
var CONSUMER_SECRET = null;

var CUSTOM_UI_PAYMENT_METHODS = [];

/* Payment Methods */
var EWALLET = new models.PaymentMethod("PESAPAL", "PesaPal", "PesaPal Account", null),
    MPESA = new models.PaymentMethod("MPESA", "MPesa", "Safaricom mobile payment", "220220"),
    AIRTEL = new models.PaymentMethod("ZAP", "Airtel Money", "Airtel mobile payment", "PESAPAL"),
    VISA = new models.PaymentMethod("VISA", "Visa", "Visa Credit / Debit Card", null), // PesaPal uses CREDITCARD
    MASTERCARD = new models.PaymentMethod("MASTERCARD", "MasterCard", "MasterCard Credit / Debit Card", null); //  PesaPal uses CREDITCARDMC

exports.SUPPORTED_PAYMENT_METHODS = [EWALLET, MPESA, AIRTEL, VISA, MASTERCARD];


exports.init = function (key, secret, debug) {

    CONSUMER_KEY = key;
    CONSUMER_SECRET = secret;

    if (!CONSUMER_KEY || !CONSUMER_SECRET) throw new Error("Need to specify both consumer key and secret");

    PAYMENT_STATUS_URL = debug ? "http://demo.pesapal.com/api/querypaymentstatus" : "https://www.pesapal.com/API/QueryPaymentStatus";
    PAYMENT_DETAILS_URL = debug ? "http://demo.pesapal.com/api/querypaymentdetails" : "https://www.pesapal.com/API/QueryPaymentDetails";
    DIRECT_ORDER_URL = debug ? "http://demo.pesapal.com/api/postpesapaldirectorderv4" : "https://www.pesapal.com/API/PostPesapalDirectOrderV4";

    CUSTOM_UI_PAYMENT_METHODS = [MPESA.tag, AIRTEL.tag, VISA.tag, MASTERCARD.tag];

    if(debug) {
        require('request-debug')(request);
    }

};


/**
 * Prepare xml to be sent as a query parameter
 * @param xml
 * @returns {*}
 */
var prepareXML = function (xml) {
    var php = require('phpjs');
    return php.htmlentities(xml, "ENT_NOQUOTES").replace(/"/g, "&quot;");
};


/**
 *
 * @param order
 * @param callbackURI
 * @returns {self.sign.signed_url|*}
 */
exports.generateSignedPaymentURL = function (order, callbackURI) {
    var signer = new OAuthSimple(CONSUMER_KEY, CONSUMER_SECRET);
    var rq = signer.sign({
        action: "GET",
        path: DIRECT_ORDER_URL,
        parameters: {
            oauth_callback: callbackURI,
            pesapal_request_data : prepareXML(order.toXML())
        }
    });
    return rq.signed_url;
};

/**
 * Get a payment information
 * @param params {{type: string, reference: string, transaction: string, statusOnly: boolean}}
 * @param callback
 */
exports.fetchPayment = function (params, callback) {

    params = params || {};

    var type = params.type || null;
    var reference = params.reference || null;
    var transaction = params.transaction || null;
    var statusOnly = true;
    if(params.statusOnly === false) statusOnly = false;

    if (!callback) throw new Error("No callback specified");
    if (!reference && !transaction) throw new Error("You must specify either a reference or a transaction or both.");

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

    var oauth = {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET
    };

    request.get({url:url, oauth:oauth}, function (err, resp, body) {
        var data = null;
        if (!err) {
            // TODO: Parse data
            data = body.replace(DATA_KEYS.response + "=",'');
            if(!statusOnly) {
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
    });
};

/**
 *
 * @param order
 * @param paymentMethod
 * @param callback
 */
exports.prepareOrder = function (order, paymentMethod, callback) {
    if(!order) throw new Error("No order specified");
    if(order.items.length == 0 && order.amount == 0) throw new Error("An order must have at least one(1) item");
    if(!callback) throw new Error("Callback is required");
    if(!paymentMethod) throw new Error("No payment method specified");
    if(CUSTOM_UI_PAYMENT_METHODS.indexOf(paymentMethod.tag) == -1) {
        throw new Error("Payment method not supported. Only MPesa, Airtel Money or Bank cards(Visa & MasterCard) are supported");
    }

    var signer = new OAuthSimple(CONSUMER_KEY, CONSUMER_SECRET);
    var req = signer.sign({
        action: "GET",
        path: DIRECT_ORDER_URL,
        parameters: {
            oauth_callback: 'http://dummysite.se:8528/callback/',
            pesapal_request_data : prepareXML(order.toXML())
        }
    });

    request.get(req.signed_url, function (err, resp, body) {
        if(err) {
            callback(err, null);
        } else {

            try{ // TODO: Scrap PesaPal payment page
                var scraper = new PesaPalScraper(paymentMethod, body);
                order.payment = {
                    paymentMethod: paymentMethod,
                    url: scraper.getPaymentURL(),
                    method: scraper.getHTTPMethod(),
                    parameters: scraper.getPaymentParameters()
                };
            }catch (error) {
                err = error;
            }

            callback(err, order);
        }
    });

};


/**
 *
 * @param order
 * @param callback
 * @param mobile
 * @param card
 */
exports.submitPayment = function(order, callback, mobile, card) {
    // TODO: Send mobile money code / credit card details to PesaPal

    if(!order.payment || !order.payment.method) throw new Error("Invalid/Unprepared order");

    switch (order.payment.method.tag) {
        case "VISA": // Credit / Debit Card
        case "MASTERCARD":
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
            if(!mobile) throw new Error("No transaction code supplied");

            break;

    }

    // http://developer.pesapal.com/how-to-integrate/api-reference#PostPesapalDirectOrderV4
    callback(null, reference, transaction);

};

