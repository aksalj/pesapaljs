/**
 *  Copyright (c) 2014 Salama AB
 *  All rights reserved
 *  Contact: aksalj@aksalj.me
 *  Website: http://www.aksalj.me
 *
 *  Project : pesapaljs
 *  File : database
 *  Date : 10/8/14 3:02 PM
 *  Description :
 *
 */
var orders = [];

/**
 *
 * @param order
 */
exports.saveOrder = function (order) {
    orders[order.reference] = order;
};

/**
 *
 * @param reference
 * @returns {*}
 */
exports.getOrder = function (reference) {
    if(orders.hasOwnProperty(reference)){
        return orders[reference];
    }
    return null;
};