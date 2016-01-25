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
'use strict';

var pesapalXml = require("./xml");

/**
 * Mobile money model
 * @type {{new(string, string): {}}}
 */
exports.MobileMoney = class { // HUH: Need a better name?

    /**
     * Mobile money model
     * @param phone {string}
     * @param code {string}
     */
    constructor(phone, code) {
        this.phone = phone;
        this.code = code;
    }
};

/**
 * A bank card
 * @type {{new(): {}}}
 */
exports.Card = class {

    constructor() {
        this.firstName = null;
        this.lastName = null;
        this.number = null;
        this.cvv = null;
        this.expirationMonth = 1;
        this.expirationYear = 1970;
        this.country = "KE";
        this.countryCode = null;
        this.email = null;
        this.phone = null;
    }

};

/**
 * A payment method.
 * @type {{new(string, string, string, string, string): {}}}
 */
exports.PaymentMethod = class {

    /**
     *
     * @param tag {string}
     * @param name {string}
     * @param description {string}
     * @param account {string}
     * @param internalTag {string}
     */
    constructor(tag, name, description, account, internalTag) {
        this.tag = tag;
        this.account = account;
        this.name = name;
        this.description = description;
        this._internalTag = internalTag;
    }
};


/**
 * A customer
 * @type {{new(string, string): {}}}
 */
exports.Customer = class {

    /**
     *
     * @param email {string}
     * @param phone {string}
     */
    constructor(email, phone) {

        if(!email || (!email && !phone)) throw new Error("One of Email and Phone is required");

        this.firstName = null;
        this.lastName = null;
        this.email = email; // required
        this.phoneNumber = phone;
        this.accountNumber = null;
    }
};


/**
 *
 * @type {{new(string, number, number, string): {}}}
 */
exports.Item = class {

    /**
     *
     * @param itemId {string}
     * @param quantity {number}
     * @param unitCost {number}
     * @param details {string}
     */
    constructor(itemId, quantity, unitCost, details) {

        if(!itemId) throw new Error("Item ID is required");
        if(!quantity) throw new Error("Quantity is required");
        if(!unitCost) throw new Error("Unit cost is required");

        this.id = itemId;
        this.particulars = details;
        this.quantity = quantity;
        this.cost = unitCost;
        this.subTotal = quantity * unitCost;
    }
};


/**
 *
 * @type {{new(string, Customer, string, number=, string=, string=): {toXML: (function(): string), setPaymentMethod: (function(PaymentMethod)), addItem: (function(Item)), getPaymentMethod: (function(): PaymentMethod)}}}
 */
exports.Order = class {

    /**
     *
     * @param reference {string}
     * @param customer {Customer}
     * @param description {string}
     * @param amount {number}
     * @param currency {string}
     * @param type {string}
     */
    constructor(reference, customer, description, amount, currency, type) {

        if(!reference) throw new Error("Merchant reference is required");
        if(!customer) throw new Error("Customer is required");
        if(!description) throw new Error("Description is required");

        this.items = [];
        this.amount = amount || 0.0;
        this.currency = currency || "KES";
        this.type = type || "MERCHANT";
        this.description = description;
        this.reference = reference;
        this.customer = customer;
        this._paymentMethod = null;
    }

    /**
     * Add an item to the order
     * @param item {Item}
     */
    addItem(item) {
        if(item){
            this.items.push(item);
            this.amount += item.subTotal;
        }
    }

    /**
     *
     * @param method {PaymentMethod}
     */
    setPaymentMethod(method) {
        this._paymentMethod = method;
    }

    /**
     *
     * @returns {PaymentMethod}
     */
    getPaymentMethod() {
        return this._paymentMethod;
    }

    /**
     * Form an XML version of this order. See PesaPal request data schema
     * @returns {string}
     */
    toXML() {
        return pesapalXml.generate(this);
    }
};