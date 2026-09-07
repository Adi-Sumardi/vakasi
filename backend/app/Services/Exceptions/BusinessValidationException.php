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
    public function __construct(private readonly string $field, string $message)
    {
        parent::__construct($message);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function errors(): array
    {
        return [$this->field => [$this->getMessage()]];
    }
}
