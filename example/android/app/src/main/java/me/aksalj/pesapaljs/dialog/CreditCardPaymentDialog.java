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
 * File : me.aksalj.pesapaljs.dialog.CreditCardPaymentDialog
 * Date : Oct, 10 2014 7:06 PM
 * Description :
 */
public class CreditCardPaymentDialog extends AlertDialog.Builder {

    public interface ICallback {
        public void onPay(String... cardDetails);
        public void onCancel();
    }

    public CreditCardPaymentDialog(Context context, final ICallback callback) {
        super(context);

        this.setCancelable(false);

        View root = LayoutInflater.from(context).inflate(R.layout.credit_card, null);
        final EditText cardNumber = (EditText)root.findViewById(R.id.number);
        final EditText cvv = (EditText)root.findViewById(R.id.cvv);
        //...
        this.setView(root);

        this.setPositiveButton("Pay", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                String[] details = new String[]{
                        // Fill in card details
                        "Joe",
                        "Bart",
                        cardNumber.getText().toString(),
                        cvv.getText().toString(),
                        "09/2018",
                        "KE",
                        "254",
                        "718769882",
                        "jb@aksalj.me"
                };
                callback.onPay(details);
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
