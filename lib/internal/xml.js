/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : xml
 *  Date : 10/2/14 3:41 PM
 *  Description :
 *
 *  Try different xml structures because PesaPal documentation not consistent
 *
 */

/**
 * XML structure in official documentation.
 * @param order
 * @returns {string}
 */
var docVersion = function (order) {
    // FIXME: Why is this being rejected?
    var xml = '<?xml version="1.0" encoding="utf-8" ?>';
    xml += '<PesapalDirectOrderInfo ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +

        "Amount=\"" + order.amount + "\" " +
        "Currency=\"" + order.currency + "\" " +
        "Description=\"" + order.description + "\" " + // Escape description?
        "Type=\"" + order.type + "\" " +
        "Reference=\"" + order.reference + "\" " +
        "FirstName=\"" + order.customer.firstName + "\" " +
        "LastName=\"" + order.customer.lastName + "\" ";

    if (order.customer.email) {
        xml += "Email=\"" + order.customer.email + "\" ";
    }
    if (order.customer.phoneNumber) {
        xml += "PhoneNumber=\"" + order.customer.phoneNumber + "\" ";
    }

    xml += "xmlns=\"http://www.pasapal.com\"";

    if(order.items.length > 0) {

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

var custVersion = function (order) {
    var xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
        "<PesapalDirectOrderInfo xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
        "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
        "Amount=\"" + order.amount + "\" " +
        "Currency=\"" + order.currency + "\" " +
        "Description=\"" + order.description + "\" " +
        "Type=\"" + order.type + "\" " +
        "Reference=\"" + order.reference + "\" " +
        "FirstName=\"" + order.customer.firstName + "\" " +
        "LastName=\"" + order.customer.lastName + "\" " +
        "Email=\"" + order.customer.email + "\" " +
        "PhoneNumber=\"" + order.customer.phoneNumber + "\" xmlns=\"http://www.pesapal.com\" />";
    return xml;

};

/**
 * Generate direct order XML
 * @param order
 * @returns {string}
 */
exports.generate = function (order) {
    return custVersion(order);
};