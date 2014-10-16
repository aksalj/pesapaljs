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
 *  See See http://developer.pesapal.com/how-to-integrate/api-reference
 *
 */
var pesapalXml = require("./xml");


/**
 * Mobile money model
 * @returns {{phone: string, code: string}}
 * @constructor
 */
exports.MobileMoney = function (phone, code) { // HUH: Need a better name?
    return {
        phone: phone, // Mobile number sending money
        code: code // transaction code
    }
};

/**
 * A bank card
 * @returns {{firstName: string, lastName: string, number: number, cvv: number, expirationMonth: number, expirationYear: number, country: string, countryCode: number, email: string, phone: string}}
 * @constructor
 */
exports.Card = function () {
    return {
        firstName: "Xxxxxx",
        lastName: "Xxxxxx",
        number: 4242424242424242,
        cvv: 123,
        expirationMonth: 9,
        expirationYear: 1970,
        country: "KE",
        countryCode: 254,
        email: "xxx@xxxxxx.com",
        phone: "2547xxxxxxxx"
    }
};

/**
 * A payment method.
 * @param tag string
 * @param name string
 * @param description string
 * @param account string
 * @param internalTag string
 * @returns {{tag: *, account: *, name: *, description: *}}
 * @constructor
 */
exports.PaymentMethod = function (tag, name, description, account, internalTag) {
    return {
        tag: tag,
        account: account,
        name: name,
        description: description,
        _internalTag: internalTag
    };
};

/**
 * A customer
 * @param email string
 * @param phone string
 * @returns {{firstName: string, lastName: string, email: string, phoneNumber: string, accountNumber: string}}
 * @constructor
 */
exports.Customer = function (email, phone) {

    if(!email || (!email && !phone)) throw new Error("One of Email and Phone is required");

    return {
        firstName:null,
        lastName:null,
        email: email, // required
        phoneNumber:phone,
        accountNumber:null
    };
};

/**
 *
 * @param itemId
 * @param quantity
 * @param unitCost
 * @param details
 * @returns {{id: string, particulars: string, quantity: number, cost: number, subTotal: number}}
 * @constructor
 */
exports.Item = function (itemId, quantity, unitCost, details) {

    if(!itemId) throw new Error("Item ID is required");
    if(!quantity) throw new Error("Quantity is required");
    if(!unitCost) throw new Error("Unit cost is required");

    return {
        id: itemId,
        particulars: details,
        quantity: quantity,
        cost: unitCost,
        subTotal: quantity * unitCost
    };
};

/**
 *
 * @param reference
 * @param customer
 * @param description
 * @param amount
 * @param currency
 * @param type
 * @returns {{items: Array, amount: number, currency: string, description: string, type: string, reference: string, customer: Customer}}
 * @constructor
 */
exports.Order = function (reference, customer, description, amount, currency, type) {

    type = type || "MERCHANT";
    currency = currency || "KES";
    amount = amount || 0.0;

    if(!reference) throw new Error("Merchant reference is required");
    if(!customer) throw new Error("Customer is required");
    if(!description) throw new Error("Description reference is required");


    var _this = {
        items: [],
        amount: amount,
        currency: currency,
        description: description,
        type: type, // "MERCHANT" or "ORDER"
        reference: reference,
        customer: customer,
        _paymentMethod: null
    };

    /**
     * Add an item to the order
     * @param item
     */
    _this.addItem = function (item) {
        if(item){
            _this.items.push(item);
            _this.amount += item.subTotal;
        }
    };


    /**
     *
     * @param method PaymentMethod
     */
    _this.setPaymentMethod = function(method) {
        _this._paymentMethod = method;
    };

    /**
     *
     * @returns PaymentMethod
     */
    _this.getPaymentMethod = function () {
        return _this._paymentMethod;
    };

    /**
     * Form an XML version of this order. See PesaPal request data schema
     * @returns {string}
     */
    _this.toXML = function () {
        return pesapalXml.generate(_this);
    };

    return _this;
};