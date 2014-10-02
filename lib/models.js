/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : models
 *  Date : 10/2/14 3:41 PM
 *  Description : Models that match the schema
 *
 */

exports.Customer = function () {
    return {
        firstName:null,
        lastName:null,
        email:null, // required
        phoneNumber:null,
        accountNumber:null
    };
};

exports.Item = function () { // LineItem
    return {
        id: null,
        particulars: null,
        quantity: 0,
        cost: 0.0,
        subTotal: 0.0
    };
};

exports.Order = function () { // PesapalDirectOrderInfo
    return {
        items: [],
        amount: 0.0,
        currency: "kes",
        description: null,
        type: null, // "MERCHANT" or "ORDER"
        reference: null,
        customer: null
    };
};