import Chart, { Tooltip, type ChartType, type TooltipModel, type TooltipPositionerFunction } from 'chart.js/auto';

declare module 'chart.js' {
	interface TooltipPositionerMap {
		followMouse: TooltipPositionerFunction<ChartType>;
	}
}

// Global Chart Defaults
Chart.defaults.font.size = 16;
Chart.defaults.color = '#000000';

export const chartConfig = (type: string, labels: (string | null)[], datasets: any[], title?: string, subtitle?: string) => {
	const isCategoryAxis = ['bar', 'line'].includes(type);
	const isCartesian = isCategoryAxis || ['scatter', 'bubble'].includes(type);

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
			...(isCartesian && {
				scales: {
					y: { beginAtZero: true },
					x: { grid: { display: false } }
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
				title: { display: !!title, text: title },
				subtitle: { display: !!subtitle, text: subtitle }
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

	let tooltipEl = parentNode.querySelector<HTMLDivElement>('div.chartjs-tooltip');

	if (!tooltipEl) {
		tooltipEl = document.createElement('div');
		tooltipEl.classList.add('chartjs-tooltip');

		Object.assign(tooltipEl.style, {
			background: '#ffffff',
			borderRadius: '4px',
			boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
			opacity: '1',
			pointerEvents: 'none',
			position: 'absolute',
			transition: 'all .1s ease',
			padding: '10px 12px',
			fontFamily: 'system-ui, -apple-system, sans-serif',
			minWidth: '140px',
			zIndex: '999'
		});

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
			innerHtml += `<div style="font-size: 14px; font-weight: 500; color: black; margin-bottom: 8px;">${title}</div>`;
		});

		innerHtml += `<div style="color: black; display: flex; flex-direction: column; gap: 1px;">`;

		tooltip.body.forEach((_, i: number) => {
			const colors = tooltip.labelColors[i];
			const dataset = chart.data.datasets[tooltip.dataPoints[i].datasetIndex];
			const label = dataset.label;
			const value = tooltip.dataPoints[i].raw;

			innerHtml += `
			<div style="display: flex; align-items: center; justify-content: space-between; font-size: 14px;">
				<div style="display: flex; align-items: center; gap: 8px;">
					<span style="background: ${colors.backgroundColor as string}; width: 12px; height: 12px; border-radius: 3px; display: inline-block;"></span>
					<span>${label}</span>
				</div>
				<span style="margin-left: 20px; font-weight: bolder;">${value}</span>
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

export async function initChart(chartType: 'bar' | 'line' = 'bar', selector: string = '.chart') {
	const canvases = document.querySelectorAll<HTMLCanvasElement>(selector);

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

			new Chart(canvas, chartConfig(chartType, labels, datasets, title, subtitle));
		} catch (error) {
			console.error(`Failed to render ${chartType} chart:`, error);
		}
	}
}

export async function initBarCharts() {
	const canvases = document.querySelectorAll<HTMLCanvasElement>('.astro-bar-chart');

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
