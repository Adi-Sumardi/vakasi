<?php

namespace App\Services;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\Result\ResultInterface;

/**
 * Generates the approval QR code per FLOW.md section 8 / ARSITEKTUR.md
 * section 11.1 — encodes a public verification URL, never raw data,
 * so scanning it never exposes honor amounts or other sensitive
 * fields (see PublicVerificationController).
 */
class QrCodeService
{
    public function generate(string $data): ResultInterface
    {
        return (new Builder(writer: new PngWriter, data: $data, size: 300, margin: 10))->build();
    }

    /**
     * The public verification URL a scanner lands on. Built from
     * config('app.frontend_url') — callers used to read
     * config('cors.allowed_origins')[0], which made a user-facing link
     * depend on the ordering of a CORS allowlist.
     */
    public function verificationUrl(string $verificationCode): string
    {
        return rtrim((string) config('app.frontend_url'), '/')."/verify/{$verificationCode}";
    }
}
