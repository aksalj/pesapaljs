package me.aksalj.pesapaljs;

import retrofit.http.Field;
import retrofit.http.FormUrlEncoded;
import retrofit.http.GET;
import retrofit.http.POST;
import retrofit.http.Path;
import retrofit.http.Query;

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

    class OrderResult {
        String reference;
    }

    class PaymentResult {
        String reference, transaction;
    }


    @GET("/payment_status")
    PaymentStatus getPaymentStatus(@Query("reference") String reference);

    @GET("/payment_status")
    PaymentStatus getPaymentStatus(@Query("reference") String reference, @Query("transaction") String transaction);

    @GET("/payment_details")
    PaymentDetails getPaymentDetails(@Query("reference") String reference);


    @FormUrlEncoded
    @POST("/make_order")
    OrderResult makeOrder(
            @Field("reference") String reference,
            @Field("type") String type,
            @Field("amount") float amount,
            @Field("currency") String currency,
            @Field("description") String description,
            @Field("firstName") String firstName,
            @Field("lastName") String lastName,
            @Field("email") String email,
            @Field("phone") String phone,
            @Field("method") String method);

    @FormUrlEncoded
    @POST("/pay_order")
    PaymentResult payMobileOrder(
            @Field("reference") String reference,
            @Field("phone") String phone,
            @Field("code") String code);

    @FormUrlEncoded
    @POST("/pay_order")
    PaymentResult payCreditCardOrder(
            @Field("reference") String reference,
            @Field("first_name") String first_name,
            @Field("last_name") String last_name,
            @Field("number") String cardNumber,
            @Field("cvv") String cardSecurity,
            @Field("expiry") String cardExpiry,
            @Field("country") String country,
            @Field("country_code") String countryCode,
            @Field("phone") String phone,
            @Field("email") String email);

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
