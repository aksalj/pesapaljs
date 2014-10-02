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

    /* Models */
    exports.Customer = models.Customer;
    exports.Order = models.Order;
    exports.Item = models.Item;


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
     *
     * @param order
     * @returns {string}
     */
    var makeXMLOrder = function (order) {
        return "xml";
    };


    exports.parsePaymentNotification = function (req, res, next) {

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

    exports.directOrder = function ( order ) {

        var oauth = new OAuth.OAuth(
            null, // requestUrl
            null, // accessUrl
            CONSUMER_KEY,
            CONSUMER_SECRET,
            '1.0A',
            null, // authorize_callback
            'HMAC-SHA1'
        );

        var data = makeXMLOrder(order);
        var body = DATA_KEYS.request + "=" + data;

        oauth.post(DIRECT_ORDER_URL, CONSUMER_KEY, CONSUMER_SECRET, body, "application/x-www-form-urlencoded",
            function (err, data, response) {
                // TODO: Play around with PesaPal html
                require('utils').inspect(response);
        });
    };



}).call(this);