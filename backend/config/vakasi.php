<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Payment Module
    |--------------------------------------------------------------------------
    |
    | VAKASI's responsibility ends at Kepala Sekolah approval: the actual
    | disbursement happens downstream in Sianggar, after SDM downloads the
    | approved data from Sianggar (FLOW.md section 8). The payment module
    | (PaymentService, /payments routes, the Keuangan > Pembayaran screen)
    | is therefore dormant rather than deleted — it stays available behind
    | this flag in case VAKASI is later asked to mirror Sianggar's
    | disbursement status locally.
    |
    | Off in production; the test suite turns it on (phpunit.xml) so the
    | dormant code keeps its coverage and cannot rot silently.
    |
    */

    'payment_module' => env('VAKASI_PAYMENT_MODULE', false),

    /*
    |--------------------------------------------------------------------------
    | Sianggar Integration
    |--------------------------------------------------------------------------
    |
    | On approval, VAKASI pushes the approved activity to Sianggar, where it
    | appears under the "Vakasi" menu for SDM to download (FLOW.md section 8
    | step 2, resolved in favour of a webhook push).
    |
    | With no `url` configured the push is skipped entirely, so local and
    | test environments never attempt an outbound call by accident.
    |
    | `secret` is a shared HMAC key: the raw JSON body is signed and sent
    | as X-Vakasi-Signature, matching the scheme Sianggar already uses for
    | its fingerprint-device webhook. A bearer token would be replayable
    | and would not prove the body was untampered.
    |
    */

    'sianggar' => [
        'url' => env('SIANGGAR_WEBHOOK_URL'),
        'secret' => env('SIANGGAR_WEBHOOK_SECRET'),
        'timeout' => (int) env('SIANGGAR_WEBHOOK_TIMEOUT', 15),

        // Separate key for the inbound direction: a leaked outbound key
        // should not also let anyone forge disbursement progress.
        'callback_secret' => env('SIANGGAR_CALLBACK_SECRET'),
    ],

];
