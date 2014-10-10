package me.aksalj.pesapaljs.dialog;

import android.app.AlertDialog;
import android.content.Context;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Copyright (c) 2014 Salama AB
 * All rights reserved
 * Contact: aksalj@aksalj.me
 * Website: http://www.aksalj.me
 * <p/>
 * Project : PesaPalJS
 * File : me.aksalj.pesapaljs.WebDialog
 * Date : Oct, 09 2014 5:59 PM
 * Description :
 */
public class WebDialog extends AlertDialog.Builder {

    private CustomWebView mView;
    private WebSettings mSettings;

    public WebDialog(Context context, String url) {
        super(context);
        init(context);
        loadUrl(url);
    }


    private void init(Context cxt) {
        mView = new CustomWebView(cxt);
        mSettings = mView.getSettings();

        this.setView(mView);
    }

    public void enableJavascript(boolean enabled) {
        mSettings.setJavaScriptEnabled(enabled);
    }

    private void loadUrl(String url) {
        mView.loadUrl(url);
    }

    public void setWebViewClient(WebViewClient client) {
        mView.setWebViewClient(client);
    }


    /**
     * Help with WebView refusing to show up soft keyboard; WFT Google!!!
     *
     * See https://code.google.com/p/android/issues/detail?id=7189
     */
    private class CustomWebView extends WebView {

        public CustomWebView(Context context) {
            super(context);
        }

        @Override
        public boolean onCheckIsTextEditor() {
            return true;
        }
    }

}
