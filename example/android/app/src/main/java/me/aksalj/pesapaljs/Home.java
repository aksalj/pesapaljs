package me.aksalj.pesapaljs;

import android.app.Activity;
import android.app.ProgressDialog;
import android.os.Bundle;
import android.view.ContextMenu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.math.BigInteger;
import java.security.SecureRandom;

import butterknife.ButterKnife;
import butterknife.InjectView;
import butterknife.OnClick;
import retrofit.RestAdapter;


public class Home extends Activity {

    private SecureRandom mRandom = new SecureRandom();

    WebService mService = null;

    String mReference = null;
    float mAmount = 0.0f;
    String mDescription = "";

    @InjectView(R.id.reference)
    TextView lblReference;

    @InjectView(R.id.amount)
    TextView lblAmount;

    @InjectView(R.id.firstName)
    EditText txtFirstName;

    @InjectView(R.id.lastName)
    EditText txtLastName;

    @InjectView(R.id.email)
    EditText txtEmail;

    @InjectView(R.id.phone)
    EditText txtPhone;

    @InjectView(R.id.custom)
    Button btnInAppPayment;

    public ProgressDialog mProgressDialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        ButterKnife.inject(this);

        setTitle("Checkout");

        prepUI();

        prepService();
    }

    private void prepUI() {

        mReference = new BigInteger(64, mRandom).toString(32).toUpperCase();
        mAmount = mRandom.nextFloat() * 50000;
        mDescription = getString(R.string.description);

        lblReference.setText(mReference);
        lblAmount.setText(getString(R.string.amount, mAmount));

        mProgressDialog = new ProgressDialog(this);
        mProgressDialog.setMessage("Please wait...");
        mProgressDialog.setCancelable(false);

        registerForContextMenu(btnInAppPayment);

    }

    private void prepService() {
        RestAdapter restAdapter = new RestAdapter.Builder()
                .setLogLevel(RestAdapter.LogLevel.FULL)
                .setEndpoint("http://192.168.0.3:3000")
                .build();
        mService = restAdapter.create(WebService.class);
    }


    @Override
    public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
        super.onCreateContextMenu(menu, v, menuInfo);
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.payment_methods, menu);
    }

    @Override
    public boolean onContextItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.mpesa:
                new OrderWorker(this, "mpesa").execute();
                break;
            case R.id.airtel:
                new OrderWorker(this, "airtel").execute();
                break;
            case R.id.visa:
                new OrderWorker(this, "visa").execute();
                break;
            case R.id.mastercard:
                new OrderWorker(this, "mastercard").execute();
                break;
        }
        return super.onContextItemSelected(item);
    }

    @OnClick(R.id.custom)
    public void onCustomPayment() {
        btnInAppPayment.performLongClick(); // Show context menu
    }

    @OnClick(R.id.pesapal)
    public void onPesaPalPayment() {
        new URLWorker(this).execute();
    }

}
