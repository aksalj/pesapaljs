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

exports.PaymentMethod = function () {
    return {
        tag: null,
        name: null,
        description: null
    };
};

exports.Customer = function (email) {

    if(!email) throw new Error("Email is required");

    return {
        firstName:null,
        lastName:null,
        email: email, // required
        phoneNumber:null,
        accountNumber:null
    };
};

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

    _this.toXML = function () {
        var xml = '<!--?xml version="1.0" encoding="utf-8" ?-->';
        xml += '<PesapalDirectOrderInfo ' +
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
            'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +

            "amount='" + _this.amount + "' " +
            "currency='" + _this.currency + "' " +
            "description='" + _this.description + "' " + // Escape description?
            "type='" + _this.type + "' " +
            "reference='" + _this.reference + "' " +
            "firstname='" + _this.customer.firstName + "' " +
            "lastname='" + _this.customer.lastName + "' " +
            "email='" + _this.customer.email + "' " +
            "phonenumber='" + _this.customer.phoneNumber + "' " +

            "xmlns='http://www.paypal.com'>";

        if(_this.items.length > 0) {
            xml += "<LineItems>";
            for (var item in _this.items) {
                xml += "<LineItem " +
                    "uniqueid='" + item.id + "' " +
                    "particulars='" + item.particulars + "' " +
                    "quantity='" + item.quantity + "' " +
                    "unitcost='" + item.cost + "' " +
                    "subtotal='" + item.subTotal + "' />";
            }
            xml += "</LineItems>"
        }

        xml += "</PesapalDirectOrderInfo>";

        return xml;
    };

    return _this;
};