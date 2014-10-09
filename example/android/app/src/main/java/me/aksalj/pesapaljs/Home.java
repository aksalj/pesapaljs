package me.aksalj.pesapaljs;

import android.app.Activity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Button;
import android.widget.TextView;

import java.math.BigInteger;
import java.security.SecureRandom;

import butterknife.ButterKnife;
import butterknife.InjectView;
import butterknife.OnClick;


public class Home extends Activity {

    private SecureRandom mRandom = new SecureRandom();

    String mReference = null;
    float mAmount = 0.0f;
    String mDescription = "";

    @InjectView(R.id.reference)
    TextView mReferenceTextView;

    @InjectView(R.id.amount)
    TextView mAmountTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        ButterKnife.inject(this);

        mReference = new BigInteger(130, mRandom).toString(32);
        mAmount = mRandom.nextFloat() * 50000;
        mDescription = getString(R.string.description);

        mReferenceTextView.setText(mReference.toUpperCase());
        mAmountTextView.setText(getString(R.string.amount, mAmount));

    }



    @OnClick(R.id.custom)
    public void onCustomPayment(){

    }

    @OnClick(R.id.pesapal)
    public void onPesaPalPayment() {

    }

}
