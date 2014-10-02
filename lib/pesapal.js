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

!(function(options) {
    "use strict";

    var options = options || {}; // TODO: See https://github.com/rjrodger/parambulator

    var DEBUG = options.debug || false;
    var CONSUMER_KEY = options.key || null;
    var CONSUMER_SECRET = options.secret || null;

    if (!CONSUMER_KEY || !CONSUMER_SECRET) throw new Error("Need to specify both consumer key and secret");


    /* Data Keys */
    var DATA_KEYS = {
        type: "pesapal_notification_type", // for IPN only
        transaction: "pesapal_transaction_tracking_id",
        reference: "pesapal_merchant_reference",
        request: "pesapal_request_data" // for direct order only
    };

    /* API Endpoints */
    var PAYMENT_STATUS_URL = DEBUG ? "http://demo.pesapal.com/api/querypaymentstatus" : "https://www.pesapal.com/API/QueryPaymentStatus";
    var PAYMENT_DETAILS_URL = DEBUG ? "http://demo.pesapal.com/api/querypaymentdetails" : "https://www.pesapal.com/API/QueryPaymentDetails";
    var DIRECT_ORDER_URL = DEBUG ? "http://demo.pesapal.com/api/postpesapaldirectorderv4" : "https://www.pesapal.com/API/PostPesapalDirectOrderV4";




    /* Payment Notification & Status */


    /**
     *
     * @param options
     * @param callback
     */
    var fetchPayment = function (options, callback) {

        var options = options || {};

        var type = options.type || null;
        var reference = options.reference || null;
        var transaction = options.transaction || null;
        var statusOnly = options.status || true;


        var oauth = new OAuth.OAuth(
            null, // requestUrl
            null, // accessUrl
            CONSUMER_KEY,
            CONSUMER_SECRET,
            '1.0A',
            null, // authorize_callback
            'HMAC-SHA1'
        );

        var url = PAYMENT_STATUS_URL + "?";
        if(statusOnly == false) {
            url = PAYMENT_DETAILS_URL + "?";
        }
        if(type) { url += DATA_KEYS.type + "=" + type + "&"; }
        if(reference) { url += DATA_KEYS.reference + "=" + reference + "&"; }
        if(transaction) { url += DATA_KEYS.transaction + "=" + transaction; }


        oauth.get(url, CONSUMER_KEY, CONSUMER_SECRET,
            function (err, data, response) {
                if(callback) {
                    if(!err) {
                        // TODO: Parse data
                        if(!statusOnly) {
                            // data=pesapal_transaction_tracking_id,payment_method,payment_status,pesapal_merchant_reference
                        }
                    }
                    callback(err, data);
                }
            }
        );
    };

    /**
     * Middleware that fully parses an IPN. Passes it to next middleware as req.pesapal.ipn.
     * @param req
     * @param res
     * @param next
     */
    exports.parsePaymentNotification = function (req, res, next) {

        var ipn = {
            type: req.param(DATA_KEYS.type), // Pesapal seems to always expect 'CHANGE'
            transaction: req.param(DATA_KEYS.transaction),
            reference: req.param(DATA_KEYS.reference),
            status: "UNKNOWN",
            payment: null
        };

        var cb = function (err, payment) {

            ipn.status = payment.status;
            ipn.payment = payment; // HUH: Contains redundant info?

            req.pesapal = {
                error: err,
                ipn: ipn
            };

            next(req, res);

        };

        fetchPayment({type: ipn.type, reference: ipn.reference, transaction: ipn.transaction}, cb);
    };


    exports.paymentStatus = function (options, callback) {
        options.statusOnly = true;
        options.type = null;
        fetchPayment(options, callback);
    };

    exports.paymentDetails = function (options, callback) {
        options.statusOnly = true;
        options.type = null;
        fetchPayment(options, callback);
    };

    /**
     * Use this to post a transaction to PesaPal. PesaPal will present the user with a page which contains the
     * available payment options and will redirect to your site once the user has completed the payment process.
     * A tracking id will be returned as a query parameter – this can be used subsequently to track the payment
     * status on pesapal for this transaction.
     *
     * @param options
     */
    exports.directOrder = function (reference, order, customer, callbackURI) {

        // order: currency, items, amount, decription
        // customer: name, email, phone account

        var oauth = new OAuth.OAuth(
            null, // requestUrl
            null, // accessUrl
            CONSUMER_KEY,
            CONSUMER_SECRET,
            '1.0A',
            null, // authorize_callback
            'HMAC-SHA1'
        );

        var data = "";// TODO: use order_schema.xml to create order xml
        var body = DATA_KEYS.request + "=" + data;

        oauth.post(DIRECT_ORDER_URL, CONSUMER_KEY, CONSUMER_SECRET, body, "application/x-www-form-urlencoded",
            function (err, data, response) {
                // TODO: Should redirect to pesapal portal?
                require('utils').inspect(response);
        });

    };



}).call(this);