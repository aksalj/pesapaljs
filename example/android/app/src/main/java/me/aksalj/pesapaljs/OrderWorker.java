package me.aksalj.pesapaljs;

import android.os.AsyncTask;
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

    OrderWorker(Home context, String method) {
        this.method = method;
        this.context = context;
    }


    @Override
    protected void onPreExecute() {
        context.mProgressDialog.show();
    }

    @Override
    protected void onPostExecute(WebService.OrderResult orderResult) {
        if (orderResult != null) {
            // TODO: Show payment collection UI
            if(method.contentEquals("mpesa") || method.contentEquals("airtel")) {
                new MobilePaymentDialog(context, orderResult.reference).show();
            } else if (method.contentEquals("visa") || method.contentEquals("mastercard")) {
                new CreditCardPaymentDialog(context, orderResult.reference).show();
            } else {
                Toast.makeText(context, "WTF??", Toast.LENGTH_SHORT).show();
            }
        } else {
            Toast.makeText(context, "Failed to prepare order", Toast.LENGTH_LONG).show();
        }
        context.mProgressDialog.cancel();
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
