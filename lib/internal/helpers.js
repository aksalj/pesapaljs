/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : helpers
 *  Date : 11/12/14 5:40 PM
 *  Description :
 *
 */

var core = require('./core');

exports.getPaymentMethodByTag = function (tag) {
    var found = null; // TODO: Need a simpler way!!!!
    core.SUPPORTED_PAYMENT_METHODS.forEach(function(method) {
        if(method.tag == tag) found = method;
    });
    return found;
};