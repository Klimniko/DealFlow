/**
 * Convert an amount between currencies using the latest fx_rates entries.
 * @param {import('mysql2/promise').Pool} db
 * @param {{ amount: number, fromCurrency: string, toCurrency: string, asOfDate?: string | null }} args
 */
async function convertCurrency(db, args) {
  if (args.fromCurrency === args.toCurrency) {
    return args.amount;
  }

  const baseQuery = `SELECT rate FROM fx_rates
    WHERE base = ? AND quote = ? ${args.asOfDate ? 'AND as_of <= ?' : ''}
    ORDER BY as_of DESC LIMIT 1`;

  const params = [args.fromCurrency, args.toCurrency];
  if (args.asOfDate) {
    params.push(args.asOfDate);
  }

  const [rows] = await db.query(baseQuery, params);

  if (!rows || rows.length === 0) {
    const inverseParams = [args.toCurrency, args.fromCurrency];
    if (args.asOfDate) {
      inverseParams.push(args.asOfDate);
    }
    const [inverseRows] = await db.query(baseQuery, inverseParams);
    if (!inverseRows || inverseRows.length === 0) {
      throw new Error(`No FX rate found for ${args.fromCurrency} to ${args.toCurrency}`);
    }
    return args.amount / inverseRows[0].rate;
  }

  return args.amount * rows[0].rate;
}

module.exports = { convertCurrency };
