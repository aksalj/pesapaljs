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
var Promise = require('bluebird');
var OAuthSimple = require('oauthsimple');
var request = require('request');
var URL = require('url');
var models = require('./models');
var PesaPalScraper = require('./scraper');

var DEBUG = false;

/* Data Keys */
var DATA_KEYS = {
    type: "pesapal_notification_type", // for IPN only
    transaction: "pesapal_transaction_tracking_id",
    reference: "pesapal_merchant_reference",
    request: "pesapal_request_data", // for direct order only
    response: "pesapal_response_data",
    redirect_url: "url" // for when submitting payment data
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
var EWALLET = new models.PaymentMethod("PESAPAL", "PesaPal", "PesaPal Account", null, null),
    MPESA = new models.PaymentMethod("MPESA", "MPesa", "Safaricom mobile payment", "220220", null),
    AIRTEL = new models.PaymentMethod("ZAP", "Airtel Money", "Airtel mobile payment", "PESAPAL", null),
    VISA = new models.PaymentMethod("VISA", "Visa", "Visa Credit / Debit Card", null, "CREDITCARD"),// PesaPal uses CREDITCARD, CREDITCARD_CS_KE for test cards?
    MASTERCARD = new models.PaymentMethod("MASTERCARD", "MasterCard", "MasterCard Credit / Debit Card", null, "CREDITCARDMC"); //  PesaPal uses CREDITCARDMC

exports.SUPPORTED_PAYMENT_METHODS = [EWALLET, MPESA, AIRTEL, VISA, MASTERCARD];

var cookieJar = request.jar();
var requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36' // Chrome 37
};

/**
 * Setup the module
 * @param key
 * @param secret
 * @param debug
 */
exports.setup = function (key, secret, debug) {

    DEBUG = debug;

    CONSUMER_KEY = key;
    CONSUMER_SECRET = secret;

    PAYMENT_STATUS_URL = DEBUG ? "https://demo.pesapal.com/api/querypaymentstatus" : "https://www.pesapal.com/API/QueryPaymentStatus";
    PAYMENT_DETAILS_URL = DEBUG ? "https://demo.pesapal.com/api/querypaymentdetails" : "https://www.pesapal.com/API/QueryPaymentDetails";
    DIRECT_ORDER_URL = DEBUG ? "https://demo.pesapal.com/api/postpesapaldirectorderv4" : "https://www.pesapal.com/API/PostPesapalDirectOrderV4";

    CUSTOM_UI_PAYMENT_METHODS = [MPESA.tag, AIRTEL.tag, VISA.tag, MASTERCARD.tag];

    if (DEBUG) {
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
 * @returns string
 */
exports.generateSignedPaymentURL = function (order, callbackURI) {
    var signer = new OAuthSimple(CONSUMER_KEY, CONSUMER_SECRET);
    var rq = signer.sign({
        action: "GET",
        path: DIRECT_ORDER_URL,
        parameters: {
            oauth_callback: callbackURI,
            pesapal_request_data: prepareXML(order.toXML())
        }
    });
    return rq.signed_url;
};

/**
 * Get a payment information
 * @param params {{type: string, reference: string, transaction: string, statusOnly: boolean}}
 * @returns {bluebird|exports|module.exports}
 */
exports.fetchPayment = function (params) {
    params = params || {};

    var type = params.type || null;
    var reference = params.reference || null;
    var transaction = params.transaction || null;
    var statusOnly = true;
    if (params.statusOnly === false) statusOnly = false;

    if (!reference && !transaction) throw new Error("You must specify either a reference or a transaction or both.");

    var signParams = {
        action: "GET",
        path: PAYMENT_STATUS_URL,
        parameters: {}
    };

    if (statusOnly == false) {
        signParams.path = PAYMENT_DETAILS_URL;
    }
    if (type) {
        signParams.parameters[DATA_KEYS.type] = type;
    }
    if (reference) {
        signParams.parameters[DATA_KEYS.reference] = reference;
    }
    if (transaction) {
        signParams.parameters[DATA_KEYS.transaction] = transaction;
    }


    var signer = new OAuthSimple(CONSUMER_KEY, CONSUMER_SECRET);
    var req = signer.sign(signParams);

    return new Promise(function (resolve, reject) {

        request.get({url: req.signed_url}, function (err, resp, body) {
            var data = null;
            if (!err) {
                // TODO: Parse data

                if (body.indexOf("Problem:") == 0) {
                    err = new Error(body)
                } else if (resp.statusCode != 200) {
                    err = new Error(`Something went wrong; Could not fetch payment. (Error ${resp.statusCode})`);
                } else {
                    data = body.replace(DATA_KEYS.response + "=", '');
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
            }
            if (err || !data) {
                reject(err);
            } else {
                resolve(data);
            }
        });

    });
};


/**
 *
 * @param order
 * @param paymentMethod
 * @returns {bluebird|exports|module.exports}
 */
exports.prepareOrder = function (order, paymentMethod) {

    if (!order) throw new Error("No order specified");
    if (order.items.length == 0 && order.amount == 0) throw new Error("An order must have at least one(1) item");

    paymentMethod = paymentMethod || order.getPaymentMethod();
    if (!paymentMethod) throw new Error("No payment method specified");

    if (CUSTOM_UI_PAYMENT_METHODS.indexOf(paymentMethod.tag) == -1) {
        throw new Error("Payment method not supported. Only MPesa, Airtel Money or Bank cards(Visa & MasterCard) are supported");
    }

    // Add this for possible use by a client
    order.setPaymentMethod(paymentMethod);

    var signer = new OAuthSimple(CONSUMER_KEY, CONSUMER_SECRET);
    var req = signer.sign({
        action: "GET",
        path: DIRECT_ORDER_URL,
        parameters: {
            oauth_callback: 'http://dummysite.se:8528/callback/',
            pesapal_request_data: prepareXML(order.toXML())
        }
    });

    return new Promise(function (resolve, reject) {

        request.get({url: req.signed_url, jar: cookieJar, headers: requestHeaders}, function (err, resp, body) {
            if (err) {
                reject(err);
            } else {

                try { // TODO: Scrap PesaPal payment page

                    if (body.indexOf("Problem:") == 0)  throw body;

                    order._scraper = new PesaPalScraper(paymentMethod, body, DEBUG);

                    requestHeaders.Referer = req.signed_url;

                } catch (error) {
                    err = new Error(error);
                    reject(err);
                }

                resolve(order);
            }
        });

    });


};

/**
 * Send mobile money code / credit card details to PesaPal.
 * @param order
 * @param paymentData {MobileMoney | Card}
 * @returns {bluebird|exports|module.exports}
 */
exports.submitPayment = function (order, paymentData) {

    if (!order._scraper) throw new Error("Invalid/Unprepared order");
    if (!paymentData) throw new Error("No Card/Transaction Info  Supplied");

    var params = order._scraper.paymentData;

    switch (order._scraper.paymentMethod) {
        case "VISA": // Credit / Debit Card
        case "MASTERCARD":

            params.FirstName = paymentData.firstName;
            params.LastName = paymentData.lastName;
            params.Email = paymentData.email;
            params.Country = paymentData.country;
            params.CountryCode = paymentData.countryCode;
            params.PhoneNumber = paymentData.phone;
            params.CreditCardNumber = paymentData.number;
            params.Cvv2Number = paymentData.cvv;
            params.ExpDateMonth = paymentData.expirationMonth;
            params.ExpDateYear = paymentData.expirationYear;
            break;

        default: // Mobile Money

            params.MobileNumber = paymentData.phone;
            params.TransactionCode = paymentData.code;
            break;
    }


    var url = order._scraper.url;
    switch (order._scraper.httpMethod.toUpperCase()) {
        case "POST":

            return new Promise(function (resolve, reject) {

                var parseResponse = function (err, resp, body) {
                    if (err) {
                        reject(err);
                    } else if (resp.statusCode == 500) {
                        reject(new Error("Failed to submit payment"));
                    } else if (resp.statusCode == 200) { // Some error occurred, probably invalid code/card info
                        reject(new Error("Check Payment Details"));
                    } else if (resp.statusCode == 302) { // Do they send another status for redirect?


                        // HUH: No need to redirect, they seem to include the reference and transaction id in the redirect URI
                        try {
                            var uri = URL.parse(resp.headers.location, true);
                            uri = URL.parse(uri.query[DATA_KEYS.redirect_url], true); // http://dummysite.se:8528/callback/?pesapal_transaction_tracking_id=XXXX&pesapal_merchant_reference=XXXX

                            var reference = uri.query[DATA_KEYS.reference]; // From redirect URI
                            var transaction = uri.query[DATA_KEYS.transaction];

                            if (!reference || !transaction) {
                                err = new Error("Unable to submit payment / No transaction ID returned");
                                reject(err);
                            } else {
                                resolve({
                                    reference: reference,
                                    transaction: transaction
                                });
                            }
                        } catch (err) {
                            console.error(err);
                            reject(new Error("Unable to submit payment."));
                        }
                    }
                };

                request.post({
                    url: url,
                    jar: cookieJar,
                    headers: requestHeaders
                }, parseResponse).form(params);

            });

        case "GET": // HUH: Not likely to happen!
        default:
            throw new Error("WTF PesaPal!");
    }

};
