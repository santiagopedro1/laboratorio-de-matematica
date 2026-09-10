import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export interface ChartDataRow {
	[key: string]: any;
}

export function parseCSV(content: string): ChartDataRow[] {
	content = content.trim();
	if (!content) return [];

	const lines = content.split(/\r?\n/);
	const headers = lines[0].split(',').map((header) => header.trim());

	const result: ChartDataRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values = line.split(',').map((val) => val.trim());
		const row: Record<string, any> = {};

		headers.forEach((header, index) => {
			const rawVal = values[index] ?? '';
			row[header] = parseValue(rawVal, header);
		});

		result.push(row as ChartDataRow);
	}

	return result;
}

function parseValue(val: string, key?: string): any {
	if (val === '') return null;
	if (val.toLowerCase() === 'true') return true;
	if (val.toLowerCase() === 'false') return false;

	// Automatically parse the 'date' column or ISO/Date strings as Date objects
	if (key === 'date' || (!isNaN(Date.parse(val)) && isNaN(Number(val)))) {
		const parsedDate = new Date(val);
		if (!isNaN(parsedDate.getTime())) return parsedDate;
	}

	if (!isNaN(Number(val))) return Number(val);

	return val.replace(/^["']|["']$/g, '');
}
