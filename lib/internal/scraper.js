/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : scraper
 *  Date : 10/2/14 8:55 AM
 *  Description : Scrap PesaPal Payment Page
 *
 */
var cheerio = require('cheerio');
var php = require('phpjs');

var PesaPalScraper = function (method, html, debug) {
    // TODO: Must throw exception if any op fails

    var $ = cheerio.load('html');

    var _paymentForm = $("form"); // currently the only form on the page

    var paymentEndpoint = $(_paymentForm).attr("action");
    var paymentEndpointMethod = $(_paymentForm).attr("method");

    var paymentData = $("input[name='PaymentData']").val();

    this.getPaymentURL = function () {
        if(debug) {
            return "http://demo.pesapal.com" + paymentEndpoint;
        } else {
            return "https://www.pesapal.com" + paymentEndpoint;
        }
    };

    this.getHTTPMethod = function () {
        return paymentEndpointMethod;
    };

    this.getPaymentParameters = function () {
        var params = {
            "PaymentData": paymentData,
            "TransactionPaymentMethod": method.tag,
            "DisplayType": "WEB" // As opposed to mobile?
        };

        if(method.tag == "MPESA" || method.tag == "ZAP") { // mobile
            params.MobileNumberCountryCodeDisabled = $("input[name='MobileNumberCountryCodeDisabled']").val();
            params.MobileNumber = "";
            params.TransactionCode = "";
        } else { // Credit cards
            params.CreditCardType = method.name; // HUH: Visa or MasterCard
            //params.PhoneNumberCountryPrefix = "254"; //?
            //params.CountryPhonePrefixList = "254";
            params.FirstName = "";
            params.LastName = "";
            params.Email = "";
            params.Country = "KE";
            params.CountryCode = "254"; // Depends on Country
            params.PhoneNumber = "";
            params.CreditCardNumber = "";
            params.ExpDateMonth = "";
            params.ExpDateYear = "";
            params.Cvv2Number = "";
        }
        return params;
    };
};

module.exports = PesaPalScraper;