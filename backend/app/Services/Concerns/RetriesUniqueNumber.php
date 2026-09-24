<?php

namespace App\Services\Concerns;

use Closure;
use Illuminate\Database\QueryException;

/**
 * Document numbers (activity_code, approval_document_number,
 * payment_number) are derived from a plain `count() + 1`, which two
 * concurrent requests can both read before either commits. Every one of
 * those columns is UNIQUE in the schema, so the loser hits an integrity
 * violation and — without this — a 500.
 *
 * Retrying on the violation is deliberate: it keeps the numbering gap-free
 * (which BR-07 wants) without holding a table lock for the whole
 * transaction. The alternative, a dedicated sequence table, is more
 * machinery than an MVP at this volume needs.
 */
trait RetriesUniqueNumber
{
    /**
     * @template TReturn
     *
     * @param  Closure(): TReturn  $callback
     * @return TReturn
     */
    protected function retryingUniqueNumber(string $column, Closure $callback, int $maxAttempts = 5): mixed
    {
        for ($attempt = 1; ; $attempt++) {
            try {
                return $callback();
            } catch (QueryException $e) {
                if ($attempt >= $maxAttempts || ! $this->isUniqueViolationFor($e, $column)) {
                    throw $e;
                }
            }
        }
    }

    private function isUniqueViolationFor(QueryException $e, string $column): bool
    {
        $message = $e->getMessage();

        // SQLSTATE 23000/23505 covers integrity violations across MySQL,
        // PostgreSQL and SQLite; the column name distinguishes *which*
        // constraint, so an unrelated violation is never swallowed.
        return in_array($e->getCode(), ['23000', '23505'], true)
            && str_contains($message, $column);
    }
}
