<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import { BarChart, LineChart, AreaChart } from 'layerchart';
	import { parseCSV } from '$lib/utils';

	const chartMap = {
		bar: BarChart,
		line: LineChart,
		area: AreaChart
	} as const;

	type ChartType = keyof typeof chartMap;

	const {
		type = 'bar',
		filename,
		x,
		y,
		seriesLayout = 'auto'
	}: {
		type: ChartType;
		filename: string;
		x: string;
		y: Array<string>;
		seriesLayout?: string;
	} = $props();

	let SelectedChart = $derived(chartMap[type] ?? BarChart);
	let data = $state<any[]>([]);

	let chartConfig = $derived(
		y.reduce(
			(acc, key, index) => {
				acc[key] = {
					label: key.charAt(0).toUpperCase() + key.slice(1),
					color: `var(--chart-${index + 1})`
				};
				return acc;
			},
			{} as Record<string, { label: string; color: string }>
		) satisfies Chart.ChartConfig
	);

	let series = $derived(
		y.map((key) => ({
			key,
			label: chartConfig[key].label,
			color: chartConfig[key].color
		}))
	);

	$effect(() => {
		const url = filename.startsWith('/') ? filename : `/dados/${filename}`;

		fetch(url)
			.then((res) => res.text())
			.then((csvText) => {
				data = parseCSV(csvText);
			});
	});
</script>

<div class="layerchart-legend-fix">
	<Chart.Container
		config={chartConfig}
		class="p-6"
	>
		<SelectedChart
			{data}
			{x}
			{series}
			axis="x"
			{seriesLayout}
			legend
		>
			{#snippet tooltip()}
				<Chart.Tooltip />
			{/snippet}
		</SelectedChart>
	</Chart.Container>
</div>
