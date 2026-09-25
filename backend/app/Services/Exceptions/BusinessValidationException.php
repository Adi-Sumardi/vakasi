<?php

namespace App\Services\Exceptions;

use RuntimeException;

/**
 * Business-rule violation raised from the Service layer (FR-07 and
 * similar rules) — distinct from Form Request input validation.
 * Rendered as a 422 in the standard envelope, see bootstrap/app.php.
 */
class BusinessValidationException extends RuntimeException
{
    /**
     * @param  array<string, array<int, string>>  $details  extra per-item errors
     *                                                      (e.g. one entry per CSV row)
     */
    public function __construct(
        private readonly string $field,
        string $message,
        private readonly array $details = [],
    ) {
        parent::__construct($message);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function errors(): array
    {
        return [$this->field => [$this->getMessage()]] + $this->details;
    }
}
