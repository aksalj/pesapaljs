package me.aksalj.pesapaljs;

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
    String callbackURI = "file:///android_asset/callback.html";

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

        final WebDialog dialog = new WebDialog(context, payment.url);
        dialog.enableJavascript(true);
        dialog.setWebViewClient(new WebViewClient(){
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if(firstLoad) {
                    context.mProgressDialog.cancel();
                    dialog.show();
                    firstLoad = false;
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {

                // TODO: Check redirect URL for order transaction id and reference
                Log.i("Payment Page Redirect", url);


                // KitKat WebView won't redirect to file:/// ???

                view.loadUrl(url);
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
                    callbackURI
            );

        } catch (Exception ex) {
            ex.printStackTrace();
        }

        return null;
    }
}