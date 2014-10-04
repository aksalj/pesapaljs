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
 *
 * @returns {{tag: null, name: null, description: null}}
 * @constructor
 */
exports.PaymentMethod = function (tag, name, description) {
    return {
        tag: tag,
        name: name,
        description: description
    };
};

/**
 *
 * @param email
 * @param phone
 * @returns {{firstName: null, lastName: null, email: string, phoneNumber: string, accountNumber: null}}
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
 * @param currency
 * @param type
 * @returns {{items: Array, amount: number, currency: string, description: string, type: string, reference: string, customer: Customer}}
 * @constructor
 */
exports.Order = function (reference, customer, description, currency, type) {

    type = type || "MERCHANT";
    currency = currency || "KES";

    if(!reference) throw new Error("Merchant reference is required");
    if(!customer) throw new Error("Customer is required");
    if(!description) throw new Error("Description reference is required");


    var _this = {
        items: [],
        amount: 0.0,
        currency: currency,
        description: description,
        type: type, // "MERCHANT" or "ORDER"
        reference: reference,
        customer: customer
    };

    _this.addItem = function (item) {
        if(item){
            _this.items.push(item);
            _this.amount += item.subTotal;
        }
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