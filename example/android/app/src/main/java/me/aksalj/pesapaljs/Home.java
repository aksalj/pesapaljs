package me.aksalj.pesapaljs;

import android.app.Activity;
import android.app.ProgressDialog;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.ContextMenu;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

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

    ProgressDialog mProgressDialog;

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
        AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) item.getMenuInfo();
        switch (item.getItemId()) {
            case R.id.mpesa: // TODO: Make order & Show receipt collection UI
            case R.id.airtel:

            case R.id.visa: // TODO: Make order & Show card info collection UI
            case R.id.mastercard:

            default:
                Toast.makeText(this, "Not implemented!", Toast.LENGTH_SHORT).show();
                return super.onContextItemSelected(item);
        }
    }

    @OnClick(R.id.custom)
    public void onCustomPayment() {
        btnInAppPayment.performLongClick(); // Show context menu
    }

    @OnClick(R.id.pesapal)
    public void onPesaPalPayment() {
        new URLFetcher().execute();
    }

    class URLFetcher extends AsyncTask<Void, Void, WebService.PaymentURL> {

        boolean firstLoad = true;
        String callbackURI = "file:///android_asset/callback.html";


        @Override
        protected void onPostExecute(WebService.PaymentURL payment) {
            // TODO: Open URL in webview
            final WebDialog dialog = new WebDialog(Home.this, payment.url);
            dialog.enableJavascript(true);
            dialog.setWebViewClient(new WebViewClient(){
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    if(firstLoad) {
                        mProgressDialog.cancel();
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
            mProgressDialog.show();
        }

        @Override
        protected WebService.PaymentURL doInBackground(Void... voids) {
            try {
                return mService.getPaymentURL (mReference, "MERCHANT", mAmount, "KES",
                        mDescription, txtFirstName.getText().toString(),
                        txtLastName.getText().toString(),
                        txtEmail.getText().toString(),
                        txtPhone.getText().toString(),
                        callbackURI
                );

            } catch (Exception ex) {
                ex.printStackTrace();
            }

            return null;
        }
    }

}
