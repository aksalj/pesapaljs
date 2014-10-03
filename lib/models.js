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
        var xml = '<?xml version="1.0" encoding="utf-8" ?>';
        xml += '<PesapalDirectOrderInfo ' +
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
            'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +

            "Amount=\"" + _this.amount + "\" " +
            "Currency=\"" + _this.currency + "\" " +
            "Description=\"" + _this.description + "\" " + // Escape description?
            "Type=\"" + _this.type + "\" " +
            "Reference=\"" + _this.reference + "\" " +
            "FirstName=\"" + _this.customer.firstName + "\" " +
            "LastName=\"" + _this.customer.lastName + "\" ";

        if (_this.customer.email) {
            xml += "Email=\"" + _this.customer.email + "\" ";
        }
        if (_this.customer.phoneNumber) {
            xml += "PhoneNumber=\"" + _this.customer.phoneNumber + "\" ";
        }

        xml += "xmlns=\"http://www.paypal.com\"";

        if(_this.items.length > 0) {

            xml += ">";
            xml += "<LineItems>";
            for (var idx in _this.items) {
                var item = _this.items[idx];
                xml += "<LineItem " +
                    "uniqueid=\"" + item.id + "\" " +
                    "particulars=\"" + item.particulars + "\" " +
                    "quantity=\"" + item.quantity + "\" " +
                    "unitcost=\"" + item.cost + "\" " +
                    "subtotal=\"" + item.subTotal + "\" />";
            }
            xml += "</LineItems>";
            xml += "</PesapalDirectOrderInfo>";

        } else {
            xml += "/>";
        }

        return xml;
    };

    return _this;
};