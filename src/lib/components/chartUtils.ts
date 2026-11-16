import Chart, { Tooltip, type ChartType, type TooltipModel, type TooltipPositionerFunction } from 'chart.js/auto';

declare module 'chart.js' {
	interface TooltipPositionerMap {
		followMouse: TooltipPositionerFunction<ChartType>;
	}
}

// Global Chart Defaults
Chart.defaults.font.size = 16;

export interface ChartTheme {
	text: string;
	muted: string;
	grid: string;
}

/**
 * Resolve chart colors from the active Starlight theme. Canvas rendering cannot
 * use CSS variables directly, so the values are read from the document.
 */
export function getChartTheme(): ChartTheme {
	if (typeof document === 'undefined') {
		return { text: '#000000', muted: '#666666', grid: 'rgba(0, 0, 0, 0.1)' };
	}

	const styles = getComputedStyle(document.documentElement);
	const read = (token: string, fallback: string) => styles.getPropertyValue(token).trim() || fallback;

	return {
		text: read('--sl-color-white', '#000000'),
		muted: read('--sl-color-gray-3', '#666666'),
		grid: read('--sl-color-gray-6', 'rgba(128, 128, 128, 0.2)')
	};
}

/** Run a callback whenever the Starlight theme (light/dark) changes. */
export function onThemeChange(callback: () => void) {
	if (typeof window === 'undefined') return;

	let currentTheme = document.documentElement.dataset.theme;

	new MutationObserver(() => {
		const nextTheme = document.documentElement.dataset.theme;
		if (nextTheme === currentTheme) return;
		currentTheme = nextTheme;
		callback();
	}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export const chartConfig = (type: string, labels: (string | null)[], datasets: any[], title?: string, subtitle?: string) => {
	const isCategoryAxis = ['bar', 'line'].includes(type);
	const isCartesian = isCategoryAxis || ['scatter', 'bubble'].includes(type);
	const theme = getChartTheme();

	return {
		type,
		data: { labels, datasets },
		plugins: [
			{
				id: 'verticalHighlight',
				beforeDatasetsDraw(chart: any) {
					if (!isCategoryAxis) return;

					const activeElements = chart.getActiveElements();
					if (activeElements.length > 0) {
						const {
							ctx,
							chartArea: { top, bottom },
							scales: { x }
						} = chart;
						if (!x) return;

						const index = activeElements[0].index;
						const left = x.getPixelForValue(index - 0.5);
						const right = x.getPixelForValue(index + 0.5);

						ctx.save();
						ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
						ctx.fillRect(left, top, right - left, bottom - top);
						ctx.restore();
					}
				}
			}
		],
		options: {
			interaction: {
				mode: isCategoryAxis ? 'index' : 'nearest',
				intersect: false
			},
			hover: {
				mode: isCategoryAxis ? 'index' : 'nearest',
				intersect: false
			},
			responsive: true,
			maintainAspectRatio: false,
			...(isCartesian && {
				scales: {
					y: {
						beginAtZero: true,
						ticks: { color: theme.muted },
						grid: { color: theme.grid },
						title: { color: theme.muted }
					},
					x: {
						grid: { display: false },
						ticks: { color: theme.muted },
						title: { color: theme.muted }
					}
				}
			}),
			plugins: {
				tooltip: {
					mode: isCategoryAxis ? 'index' : 'nearest',
					intersect: false,
					position: 'followMouse',
					enabled: false,
					external: customTooltip
				},
				legend: { labels: { color: theme.text } },
				title: { display: !!title, text: title, color: theme.text },
				subtitle: { display: !!subtitle, text: subtitle, color: theme.muted }
			}
		}
	};
};

Tooltip.positioners.followMouse = function (_, eventPosition) {
	if (!eventPosition) return false;
	return {
		x: eventPosition.x,
		y: eventPosition.y
	};
};

export const getOrCreateTooltip = (chart: Chart) => {
	const parentNode = chart.canvas.parentNode;
	if (!parentNode) return null;

	const tooltipId = `${chart.canvas.id}-tooltip`;
	let tooltipEl = document.getElementById(tooltipId) as HTMLDivElement | null;

	if (!tooltipEl) {
		tooltipEl = document.createElement('div');
		tooltipEl.id = tooltipId;
		tooltipEl.classList.add(
			'pointer-events-none',
			'absolute',
			'z-[999]',
			'min-w-[140px]',
			'rounded-md',
			'border',
			'border-(--sl-color-gray-5)',
			'bg-(--sl-color-bg)',
			'px-3',
			'py-[10px]',
			'text-(--sl-color-white)',
			'shadow-[0px_4px_16px_rgba(0,0,0,0.25)]',
			'transition-all',
			'duration-100',
			'font-[system-ui,-apple-system,sans-serif]'
		);
		tooltipEl.style.opacity = '1';

		parentNode.appendChild(tooltipEl);
	}
	return tooltipEl;
};

export const customTooltip = (context: { chart: Chart; tooltip: TooltipModel<any> }) => {
	const { chart, tooltip } = context;
	const tooltipEl = getOrCreateTooltip(chart);
	if (!tooltipEl) return;

	if (tooltip.opacity === 0) {
		tooltipEl.style.opacity = '0';
		return;
	}

	if (tooltip.body) {
		const titleLines = tooltip.title || [];
		let innerHtml = '';

		titleLines.forEach((title: string) => {
			innerHtml += `<div class="mb-2 text-sm font-medium text-(--sl-color-white)">${title}</div>`;
		});

		innerHtml += `<div class="flex flex-col gap-px">`;

		tooltip.body.forEach((_, i: number) => {
			const colors = tooltip.labelColors[i];
			const dataset = chart.data.datasets[tooltip.dataPoints[i].datasetIndex];
			const label = dataset.label;
			const value = tooltip.dataPoints[i].raw;

			innerHtml += `
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center gap-2">
					<span class="inline-block h-3 w-3 rounded-[3px]" style="background: ${colors.backgroundColor as string};"></span>
					<span>${label}</span>
				</div>
				<span class="ml-5 font-bold">${value}</span>
			</div>
			`;
		});

		innerHtml += `</div>`;
		tooltipEl.innerHTML = innerHtml;
	}

	const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
	tooltipEl.style.opacity = '1';
	tooltipEl.style.left = positionX + tooltip.caretX + 'px';
	tooltipEl.style.top = positionY + tooltip.caretY + 'px';

	if (tooltip.caretX < chart.width / 2) {
		tooltipEl.style.transform = 'translate(15px, -50%)';
	} else {
		tooltipEl.style.transform = 'translate(calc(-100% - 15px), -50%)';
	}
};

export function parseCSV(csvText: string) {
	const lines = csvText.trim().split('\n');
	if (lines.length === 0) return [];

	const headers = lines[0].split(',').map((h) => h.trim());
	return lines.slice(1).map((line) => {
		const values = line.split(',');
		return headers.reduce(
			(obj, header, index) => {
				obj[header] = values[index] ? values[index].trim() : null;
				return obj;
			},
			{} as Record<string, string | null>
		);
	});
}

const chartInstances = new Map<HTMLCanvasElement, { chart: Chart; chartType: 'bar' | 'line' }>();
let themeListenerBound = false;

async function renderChart(canvas: HTMLCanvasElement, chartType: 'bar' | 'line') {
	const csvPath = canvas.dataset.csv;
	const xColumn = canvas.dataset.x;
	const yColumns = JSON.parse(canvas.dataset.y || '[]');
	const title = canvas.dataset.title;
	const subtitle = canvas.dataset.subtitle;

	if (!csvPath || !xColumn) return;

	const response = await fetch(csvPath);
	const csvText = await response.text();
	const data = parseCSV(csvText);

	const labels = data.map((row) => row[xColumn]);
	const isLine = chartType === 'line';

	const datasets = yColumns.map((yCol: string, index: number) => {
		const hue = (index * 137.5) % 360;
		const baseColor = `hsl(${hue}, 70%, 50%)`;

		return {
			label: yCol,
			data: data.map((row) => parseFloat(row[yCol] || '0')),
			backgroundColor: isLine ? `hsla(${hue}, 70%, 50%, 0.1)` : `hsla(${hue}, 70%, 50%, 0.6)`,
			borderColor: baseColor,
			borderWidth: isLine ? 2 : 1,
			fill: canvas.dataset.fill === 'true',
			tension: isLine ? 0.2 : 0,
			pointBackgroundColor: baseColor,
			pointRadius: isLine ? 3 : 0,
			pointHoverRadius: isLine ? 5 : 0
		};
	});

	const chart = new Chart(canvas, chartConfig(chartType, labels, datasets, title, subtitle));
	chartInstances.set(canvas, { chart, chartType });
}

function bindThemeListener() {
	if (themeListenerBound) return;
	themeListenerBound = true;

	onThemeChange(() => {
		for (const [canvas, { chart, chartType }] of [...chartInstances]) {
			chart.destroy();
			chartInstances.delete(canvas);
			delete canvas.dataset.initialized;

			if (canvas.isConnected) {
				renderChart(canvas, chartType).catch((error) => {
					console.error(`Failed to re-render ${chartType} chart:`, error);
				});
			}
		}
	});
}

export async function initChart(chartType: 'bar' | 'line' = 'bar', selector: string = 'canvas[id^="chart-"]') {
	const canvases = document.querySelectorAll<HTMLCanvasElement>(selector);

	for (const canvas of canvases) {
		if (canvas.dataset.initialized) continue;
		canvas.dataset.initialized = 'true';

		try {
			await renderChart(canvas, chartType);
		} catch (error) {
			console.error(`Failed to render ${chartType} chart:`, error);
		}
	}

	bindThemeListener();
}

export async function initBarCharts() {
	const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas[id^="chart-"]');

	for (const canvas of canvases) {
		if (canvas.dataset.initialized) continue;

		canvas.dataset.initialized = 'true';

		const csvPath = canvas.dataset.csv;

		const xColumn = canvas.dataset.x;

		const yColumns = JSON.parse(canvas.dataset.y || '[]');

		const title = canvas.dataset.title;

		const subtitle = canvas.dataset.subtitle;

		if (!csvPath || !xColumn) continue;

		try {
			const response = await fetch(csvPath);

			const csvText = await response.text();

			const data = parseCSV(csvText);

			const labels = data.map((row) => row[xColumn]);

			const datasets = yColumns.map((yCol: string, index: number) => {
				const hue = (index * 137.5) % 360;

				return {
					label: yCol,

					data: data.map((row) => parseFloat(row[yCol] || '0')),

					backgroundColor: `hsla(${hue}, 70%, 50%, 0.6)`,

					borderColor: `hsla(${hue}, 70%, 50%, 1)`,

					borderWidth: 1
				};
			});

			new Chart(canvas, chartConfig('bar', labels, datasets, title, subtitle));
		} catch (error) {
			console.error('Failed to render bar chart:', error);
		}
	}
}
