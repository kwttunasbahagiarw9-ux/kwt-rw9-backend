const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const todayDateKey = () => dateKeyFromDate(new Date());

export const dateKeyFromDate = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const normalizeDateKey = (value) => {
  if (!value) return todayDateKey();

  if (typeof value === 'string' && DATE_KEY_PATTERN.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime()) && value === parsed.toISOString().slice(0, 10)) {
      return value;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error('Tanggal tidak valid.');
    error.statusCode = 400;
    throw error;
  }

  return dateKeyFromDate(parsed);
};

export const toDateOnly = (dateKey) => new Date(`${dateKey}T00:00:00.000Z`);

export const sevenDaysAgoKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return dateKeyFromDate(date);
};
