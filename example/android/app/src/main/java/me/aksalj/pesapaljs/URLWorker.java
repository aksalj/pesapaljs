package me.aksalj.pesapaljs;

import android.app.AlertDialog;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import me.aksalj.pesapaljs.dialog.WebDialog;

/**
 * Copyright (c) 2014 Salama AB
 * All rights reserved
 * Contact: aksalj@aksalj.me
 * Website: http://www.aksalj.me
 * <p/>
 * Project : PesaPalJS
 * File : me.aksalj.pesapaljs.URLWorker
 * Date : Oct, 10 2014 7:20 PM
 * Description :
 */
public class URLWorker extends AsyncTask<Void, Void, WebService.PaymentURL> {

    Home context = null;
    boolean firstLoad = true;
    Uri callbackURI = Uri.parse("pesapal://payment_callback");

    public URLWorker(Home cxt) {
        this.context = cxt;
    }

    @Override
    protected void onPostExecute(WebService.PaymentURL payment) {
        // TODO: Open URL in webview

        if(payment == null){
            Toast.makeText(context, "Failed to fetch payment URL", Toast.LENGTH_LONG).show();
            context.mProgressDialog.cancel();
            return;
        }

        final WebDialog webDialog = new WebDialog(context, payment.url);
        webDialog.enableJavascript(true);
        webDialog.setWebViewClient(new WebViewClient(){

            AlertDialog dialog = null;

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if(firstLoad) {
                    context.mProgressDialog.cancel();
                    dialog = webDialog.create();
                    dialog.show();
                    firstLoad = false;
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {

                // TODO: Check redirect URL for order transaction id and reference
                Log.i("Payment Page Redirect", url);

                Uri uri = Uri.parse(url);
                if(uri.getScheme().contentEquals(callbackURI.getScheme())) {

                    // Use these for /payment_status
                    String transaction = uri.getQueryParameter("pesapal_transaction_tracking_id");
                    String reference = uri.getQueryParameter("pesapal_merchant_reference");

                    String msg = "We are processing your payment.\nReference: " + reference;
                    msg += "\nTransaction: " + transaction;

                    AlertDialog.Builder alert = new AlertDialog.Builder(context);
                    alert.setTitle("Thank you for doing business with us");
                    alert.setMessage(msg);
                    alert.create().show();

                    dialog.cancel();

                } else {
                    view.loadUrl(url);
                }
                return true;
            }
        });

    }

    @Override
    protected void onPreExecute() {
        context.mProgressDialog.show();
    }

    @Override
    protected WebService.PaymentURL doInBackground(Void... voids) {
        try {
            return context.mService.getPaymentURL (context.mReference, "MERCHANT", context.mAmount, "KES",
                    context.mDescription, context.txtFirstName.getText().toString(),
                    context.txtLastName.getText().toString(),
                    context.txtEmail.getText().toString(),
                    context.txtPhone.getText().toString(),
                    callbackURI.toString()
            );

        } catch (Exception ex) {
            ex.printStackTrace();
        }

        return null;
    }
}