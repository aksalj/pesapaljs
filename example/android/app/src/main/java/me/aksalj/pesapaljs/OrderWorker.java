package me.aksalj.pesapaljs;

import android.app.AlertDialog;
import android.os.AsyncTask;
import android.os.Handler;
import android.widget.Toast;

import me.aksalj.pesapaljs.dialog.CreditCardPaymentDialog;
import me.aksalj.pesapaljs.dialog.MobilePaymentDialog;

/**
 * Copyright (c) 2014 Salama AB
 * All rights reserved
 * Contact: aksalj@aksalj.me
 * Website: http://www.aksalj.me
 * <p/>
 * Project : PesaPalJS
 * File : me.aksalj.pesapaljs.OrderWorker
 * Date : Oct, 10 2014 7:18 PM
 * Description :
 */
public class OrderWorker extends AsyncTask<Void, Void, WebService.OrderResult> {

    Home context = null;
    private String method = null;

    private Handler handler;

    OrderWorker(Home context, String method) {
        this.method = method;
        this.context = context;
        handler = new Handler();
    }


    @Override
    protected void onPreExecute() {
        context.mProgressDialog.show();
    }

    @Override
    protected void onPostExecute(final WebService.OrderResult orderResult) {
        if (orderResult != null) {
            // TODO: Show payment collection UI
            if(method.contentEquals("mpesa") || method.contentEquals("airtel")) {

                new MobilePaymentDialog(context, new MobilePaymentDialog.ICallback() {
                    @Override
                    public void onPay(final String phone, final String code) {
                        submitMobilePayment(orderResult.reference, phone, code);
                    }
                    @Override
                    public void onCancel() { }
                }).show();

            } else if (method.contentEquals("visa") || method.contentEquals("mastercard")) {
                new CreditCardPaymentDialog(context, new CreditCardPaymentDialog.ICallback() {
                    @Override
                    public void onPay(String... cardDetails) {
                        submitCreditCardPayment(orderResult.reference, cardDetails);
                    }

                    @Override
                    public void onCancel() { }
                }).show();

            } else {
                Toast.makeText(context, "WTF??", Toast.LENGTH_SHORT).show();
                context.mProgressDialog.cancel();
            }

        } else {
            Toast.makeText(context, "Failed to prepare order", Toast.LENGTH_LONG).show();
            context.mProgressDialog.cancel();
        }
    }

    private void submitMobilePayment(final String reference, final String phone, final String code) {
        // TODO: Pay order
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {

                    final WebService.PaymentResult result =
                            context.mService.payMobileOrder(reference, phone, code);

                    handler.post(new Runnable() {
                        @Override
                        public void run() {
                            if(result != null && result.transaction != null) {
                                // Use these for /payment_status
                                String transaction = result.transaction;
                                String reference = result.reference;

                                String msg = "We are processing your payment.\nReference: " + reference;
                                msg += "\nTransaction: " + transaction;

                                AlertDialog.Builder alert = new AlertDialog.Builder(context);
                                alert.setTitle("Thank you for doing business with us");
                                alert.setMessage(msg);
                                alert.create().show();
                            }
                        }
                    });

                    context.mProgressDialog.cancel();

                }catch (Exception ex) {
                    ex.printStackTrace();
                }


            }
        }).start();
    }

    private void submitCreditCardPayment(final String reference, String... cardDetails) {

    }

    @Override
    protected WebService.OrderResult doInBackground(Void... voids) {
        try {
            return context.mService.makeOrder(context.mReference, "MERCHANT", context.mAmount, "KES", context.mDescription,
                    context.txtFirstName.getText().toString(), context.txtLastName.getText().toString(),
                    context.txtEmail.getText().toString(), context.txtPhone.getText().toString(), method);
        }catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }
}
