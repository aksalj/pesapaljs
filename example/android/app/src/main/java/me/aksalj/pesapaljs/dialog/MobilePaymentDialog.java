package me.aksalj.pesapaljs.dialog;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.widget.TextView;

/**
 * Copyright (c) 2014 Salama AB
 * All rights reserved
 * Contact: aksalj@aksalj.me
 * Website: http://www.aksalj.me
 * <p/>
 * Project : PesaPalJS
 * File : me.aksalj.pesapaljs.dialog.MobilePaymentDialog
 * Date : Oct, 10 2014 7:05 PM
 * Description :
 */
public class MobilePaymentDialog extends AlertDialog.Builder {
    public MobilePaymentDialog(Context context, String orderReference) {
        super(context);

        this.setCancelable(false);

        TextView txt = new TextView(context);
        txt.setText("Mobile form goes here");
        this.setView(txt);


        this.setPositiveButton("Pay", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {

            }
        });

        this.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {

            }
        });

    }
}
