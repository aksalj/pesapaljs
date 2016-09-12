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

// FIXME: What happens if/when PesaPal changes its html?

var PesaPalScraper = function (method, html, debug) {
    // TODO: Must throw exception if any op fails

    var $ = cheerio.load(html);

    var paymentForm = $("form"); // currently the only form on the page

    var paymentEndpoint = $(paymentForm).attr("action");
    var paymentEndpointMethod = $(paymentForm).attr("method");

    var paymentData = $("input[name='PaymentData']").val();

    var getPaymentURL = function () { // FIXME: Get'em from a single place!!!!!
        if(debug) {
            return "https://demo.pesapal.com" + paymentEndpoint;
        } else {
            return "https://www.pesapal.com" + paymentEndpoint;
        }
    };

    var getPaymentMethodTag = function () {
        return method.tag;
    };

    var getHTTPMethod = function () {
        return paymentEndpointMethod;
    };

    var getPaymentParameters = function () {
        var params = {
            "PaymentData": paymentData,
            "TransactionPaymentMethod": method.tag, // HUH: MPESA, ZAP, etc.
            "DisplayType": "WEB" // As opposed to mobile?
        };

        if(method.tag == "MPESA" || method.tag == "ZAP") { // mobile

            params.MobileNumberCountryCodeDisabled = $("input[name='MobileNumberCountryCodeDisabled']").val();
            params.MobileNumber = "";
            params.TransactionCode = "";

        } else { // Credit cards
            // TODO: Need to review PesaPal payment page to see exactly what needs to be sent.
            params.CreditCardType = method.name; // HUH: Visa or MasterCard
            params.TransactionPaymentMethod = method._internalTag; // HUH: CREDITCARD or CREDITCARDMC or -> CREDITCARDMC_CS_KE for test only?
            params.PhoneNumberCountryPrefix = "254"; //?
            params.CountryPhonePrefixList = "254";
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

    return {
        "url": getPaymentURL(),
        "httpMethod": getHTTPMethod(),
        "paymentMethod":getPaymentMethodTag(),
        "paymentData": getPaymentParameters()
    };

};

module.exports = PesaPalScraper;