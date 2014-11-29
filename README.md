## PesapalJS

[![NPM](https://nodei.co/npm/pesapaljs.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.org/package/pesapaljs)

### Goal

Make it easy to integrate [PesaPal](https://www.pesapal.com) into a website or mobile app AND most importantly allow one
to customize the payment user interface.

### Core Features
- `paymentListener`: `express` middleware that parses IPNs.

- `paymentStatus(options, callback)` : Get status of a payment. `options` should contain either a `reference` alone or a `reference` and `transaction` together.

- `paymentDetails(options, callback`): Get all information about a payment. `options` should contain a `reference` and a `transaction`.

- `getPaymentURL(order, callbackURI)`: Get a signed URL to the PesaPal payment page.

- `makeOrder(order, paymentMethod, callback)`: Prepare an order for payment on a custom UI.

- `payOrder(order, paymentDetails, callback)`: After a call to `makeOrder`, pay an order with details collected through a custom UI.

### Usage summary

###### Setup
```javascript

var PesaPal = require('pesapaljs').init({
    key: CONSUMER_KEY,
    secret: CONSUMER_SECRET,
    debug: true // false in production!
});

```
When the `debug` option is set, `pesapaljs` will use the `demo.pesapal.com/*` endpoints.
    
###### Listen for payment notifications
```javascript

// Listen for IPNs (With an express app)
app.get('/ipn', PesaPal.paymentListener, function(req, res) { 
    var payment = req.payment;
    // do shit with payment {transaction, method, status, reference}
    
    // DO NOT res.send()
});

```
    
###### Check Payment info
```javascript

var options = {
    reference: "42314123", // Send this
    transaction: "175c6485-0948-4cb9-8d72-05a2c3f25be5" // or both.
};
PesaPal.paymentStatus(options, function(error, status}{
    // do shit
});

PesaPal.paymentDetails(options, function (error, payment) {
    //payment -> {transaction, method, status, reference}
    //do shit
});

```
    
###### Make a direct order
Make your customer pay on PesaPal's page:

```javascript

var customer = new PesaPal.Customer("kariuki@pesapal.com");
var order = new PesaPal.Order("42314123", customer, "Ma ndazi", 1679.50, "KES", "MERCHANT");

// Redirect user to PesaPal
var url = PesaPal.getPaymentURL(order, "http://mysite.co.ke/callback");
// send it to an iframe ?

```

Or make your own awesome payment UI (web page, mobile app front-end, etc.):

```javascript

var customer = new PesaPal.Customer("john@pesapal.com");
var order = new PesaPal.Order("WSDE0RFCC", customer, "Maziwa", 100, "KES", "MERCHANT");

// place order directly with your own UI
PesaPal.makeOrder(order, PesaPal.PaymentMethod.Airtel, function(error, order) {
    // Get payment details from user, DB - like their credit card info ;) or whatever
    
    // ...
    
    PesaPal.payOrder(order, new PesaPal.MobileMoney("254728988983","DEWEDWED"), function (error, reference, transactionId) {
        // do shit
    });
});
```

### Contributing

1. Fork this repo and make changes in your own fork.
2. Commit your changes and push to your fork `git push origin master`
3. Create a new pull request and submit it back to the project.


### Bugs & Issues

To report bugs (or any other issues), use the [issues page](https://github.com/aksalj/pesapaljs/issues).
