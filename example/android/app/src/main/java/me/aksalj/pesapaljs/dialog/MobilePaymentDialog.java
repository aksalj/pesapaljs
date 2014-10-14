package me.aksalj.pesapaljs.dialog;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

import me.aksalj.pesapaljs.R;

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

    public interface ICallback {
        public void onPay(String phone, String code);
        public void onCancel();
    }

    public MobilePaymentDialog(Context context, final ICallback callback) {
        super(context);

        this.setCancelable(false);

        View root = LayoutInflater.from(context).inflate(R.layout.mobile_payment, null);
        final EditText phone = (EditText)root.findViewById(R.id.phone);
        final EditText code = (EditText)root.findViewById(R.id.code);
        this.setView(root);



        this.setPositiveButton("Pay", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                callback.onPay(phone.getText().toString(), code.getText().toString());
            }
        });

        this.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                callback.onCancel();
            }
        });

    }
}
