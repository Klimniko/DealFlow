import mysql from 'mysql2/promise';

type ConvertArgs = {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  asOfDate?: string | null;
};

export async function convertCurrency(db: mysql.Pool, args: ConvertArgs): Promise<number> {
  if (args.fromCurrency === args.toCurrency) {
    return args.amount;
  }

  const sql = `SELECT rate FROM fx_rates
    WHERE base = ? AND quote = ? ${args.asOfDate ? 'AND as_of <= ?' : ''}
    ORDER BY as_of DESC LIMIT 1`;

  const params: (string | number)[] = [args.fromCurrency, args.toCurrency];
  if (args.asOfDate) {
    params.push(args.asOfDate);
  }

  const [rows] = await db.query<{ rate: number }[]>(sql, params);

  if (rows.length === 0) {
    const inverseSql = `SELECT rate FROM fx_rates
      WHERE base = ? AND quote = ? ${args.asOfDate ? 'AND as_of <= ?' : ''}
      ORDER BY as_of DESC LIMIT 1`;
    const inverseParams: (string | number)[] = [args.toCurrency, args.fromCurrency];
    if (args.asOfDate) {
      inverseParams.push(args.asOfDate);
    }
    const [inverseRows] = await db.query<{ rate: number }[]>(inverseSql, inverseParams);
    if (inverseRows.length === 0) {
      throw new Error(`No FX rate found for ${args.fromCurrency} to ${args.toCurrency}`);
    }
    return args.amount / inverseRows[0].rate;
  }

  return args.amount * rows[0].rate;
}
