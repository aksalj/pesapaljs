package me.aksalj.pesapaljs;

import retrofit.http.Field;
import retrofit.http.FormUrlEncoded;
import retrofit.http.GET;
import retrofit.http.POST;
import retrofit.http.Path;

/**
 * Copyright (c) 2014 Salama AB
 * All rights reserved
 * Contact: aksalj@aksalj.me
 * Website: http://www.aksalj.me
 * <p/>
 * Project : PesaPalJS
 * File : me.aksalj.pesapaljs.WebService
 * Date : Oct, 09 2014 4:21 PM
 * Description :
 */
public interface WebService {

    class PaymentStatus {
        String reference, status;
    }

    class PaymentDetails {
        String reference, status, transaction, method;
    }

    class PaymentURL {
        String url;
    }


    @GET("/payment_status/{reference}")
    PaymentStatus getPaymentStatus(@Path("reference") String reference);

    @GET("/payment_details/{reference}")
    PaymentDetails getPaymentDetails(@Path("reference") String reference);


    @POST("/make_payment")
    String makePayment();


    @FormUrlEncoded
    @POST("/payment_url")
    PaymentURL getPaymentURL(
            @Field("reference") String reference,
            @Field("type") String type,
            @Field("amount") float amount,
            @Field("currency") String currency,
            @Field("description") String description,
            @Field("firstName") String firstName,
            @Field("lastName") String lastName,
            @Field("email") String email,
            @Field("phone") String phone,
            @Field("callback") String callback);

}
