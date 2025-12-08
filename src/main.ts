import "./index.css";
import mqtt from "mqtt";
import ApexCharts from "apexcharts";

const resetButton = document.querySelector("#reset");

const latestDate = document.querySelector("#latest");

const tempCurr = document.querySelector("#temp-curr");
const rpmCurr = document.querySelector("#rpm-curr");
const phCurr = document.querySelector("#ph-curr");

const tempIn = document.querySelector("#temp-in") as HTMLInputElement;
const rpmIn = document.querySelector("#rpm-in") as HTMLInputElement;
const phIn = document.querySelector("#ph-in") as HTMLInputElement;

const importButtons = document.querySelectorAll(
	".import",
) as NodeListOf<HTMLInputElement>;
const exportButton = document.querySelector("#export") as HTMLAnchorElement;

const updateButton = document.querySelector("#update");

const client = mqtt.connect(
	"wss://f8fdbc98599e479394681fe41965c329.s1.eu.hivemq.cloud:8884/mqtt",
	{
		username: "test1",
		password: "Test1234",
	},
);

client.on("connect", () => {
	client.subscribe("bioreactor/data", { qos: 1 });
});

const sharedConfig = (name: string) => ({
	chart: {
		type: "line",
		animations: { enabled: false },
	},
	series: [
		{
			name: name,
			data: [],
		},
		{
			name: "Setpoint",
			data: [],
		},
	],
	xaxis: {
		categories: [],
		type: "datetime",
	},
});

const temp = new ApexCharts(document.querySelector("#temp"), {
	...sharedConfig("Temperature"),
	yaxis: {
		decimalsInFloat: 2,
	},
});

const rpm = new ApexCharts(document.querySelector("#rpm"), {
	...sharedConfig("RPM"),
	yaxis: {
		decimalsInFloat: 1,
	},
});

const ph = new ApexCharts(document.querySelector("#ph"), {
	...sharedConfig("pH"),
	yaxis: {
		decimalsInFloat: 2,
	},
});

temp.render();
rpm.render();
ph.render();

const existingData = getDataStore();

let data = {
	rpm: {
		data: [] as [Date, number][],
		setpoints: [] as [Date, number][],
	},
	temp: {
		data: [] as [Date, number][],
		setpoints: [] as [Date, number][],
	},
	ph: {
		data: [] as [Date, number][],
		setpoints: [] as [Date, number][],
	},
};

if (existingData) {
	data = existingData;

	document.body.setAttribute("data-data", "true");

	temp.appendData([
		{
			name: "Temperature",
			data: data.temp.data.slice(0, -1).map(e => ({ x: e[0], y: e[1] })),
		},
		{
			name: "Setpoint",
			data: data.temp.setpoints
				.slice(0, -1)
				.map(e => ({ x: e[0], y: e[1] })),
		},
	]);

	rpm.appendData([
		{
			name: "RPM",
			data: data.rpm.data.slice(0, -1).map(e => ({ x: e[0], y: e[1] })),
		},
		{
			name: "Setpoint",
			data: data.rpm.setpoints
				.slice(0, -1)
				.map(e => ({ x: e[0], y: e[1] })),
		},
	]);

	ph.appendData([
		{
			name: "pH",
			data: data.ph.data.slice(0, -1).map(e => ({ x: e[0], y: e[1] })),
		},
		{
			name: "Setpoint",
			data: data.ph.setpoints
				.slice(0, -1)
				.map(e => ({ x: e[0], y: e[1] })),
		},
	]);

	update();
}

client.on("message", (_, message) => {
	document.body.setAttribute("data-data", "true");

	const newData = JSON.parse("" + message);

	const date = new Date();

	data.temp.setpoints.push([date, newData.setpoint_temp]);
	data.rpm.setpoints.push([date, newData.setpoint_RPM]);
	data.ph.setpoints.push([date, newData.setpoint_pH]);

	data.temp.data.push([date, newData.average_temp]);
	data.rpm.data.push([date, newData.average_RPM]);
	data.ph.data.push([date, newData.average_pH]);

	update();
});

resetButton.addEventListener("mousedown", () => {
	localStorage.clear();
	location.reload();
});

importButtons.forEach(b =>
	b.addEventListener("change", e => {
		const reader = new FileReader();
		reader.readAsText((e.target as HTMLInputElement).files[0]);

		reader.onload = () => {
			localStorage.setItem("data", reader.result + "");
			location.reload();
		};
	}),
);

function update() {
	localStorage.setItem("data", JSON.stringify(data));

	const date = new Date();
	latestDate.innerHTML =
		"Latest: " +
		date.toLocaleDateString() +
		", " +
		date.toLocaleTimeString();

	exportButton.href =
		"data:text/json;charset=utf-8," +
		encodeURIComponent(JSON.stringify(data));

	tempCurr.innerHTML = `${data.temp.data.at(-1)[1].toFixed(2)} (${data.temp.setpoints.at(-1)[1]})°C`;
	rpmCurr.innerHTML = `${data.rpm.data.at(-1)[1].toFixed(1)} (${data.rpm.setpoints.at(-1)[1]})`;
	phCurr.innerHTML = `${data.ph.data.at(-1)[1].toFixed(2)} (${data.ph.setpoints.at(-1)[1]})`;

	tempIn.placeholder = data.temp.setpoints.at(-1)[1] + "";
	rpmIn.placeholder = data.rpm.setpoints.at(-1)[1] + "";
	phIn.placeholder = data.ph.setpoints.at(-1)[1] + "";

	temp.appendData([
		{
			name: "Temperature",
			data: data.temp.data.slice(-1).map(e => ({ x: e[0], y: e[1] })),
		},
		{
			name: "Setpoint",
			data: data.temp.setpoints
				.slice(-1)
				.map(e => ({ x: e[0], y: e[1] })),
		},
	]);

	rpm.appendData([
		{
			name: "RPM",
			data: data.rpm.data.slice(-1).map(e => ({ x: e[0], y: e[1] })),
		},
		{
			name: "Setpoint",
			data: data.rpm.setpoints.slice(-1).map(e => ({ x: e[0], y: e[1] })),
		},
	]);

	ph.appendData([
		{
			name: "pH",
			data: data.ph.data.slice(-1).map(e => ({ x: e[0], y: e[1] })),
		},
		{
			name: "Setpoint",
			data: data.ph.setpoints.slice(-1).map(e => ({ x: e[0], y: e[1] })),
		},
	]);
}

function getDataStore() {
	const store = localStorage.getItem("data");
	if (!store) return undefined;

	const json = JSON.parse(store, (key, value) => {
		if (
			"string" === typeof value &&
			/^\d{4}-[01]\d-[0-3]\dT[012]\d(?::[0-6]\d){2}\.\d{3}Z$/.test(value)
		) {
			var date = new Date(value);
			if (+date === +date) {
				return date;
			}
		}
		return value;
	});

	return json;
}

updateButton.addEventListener("mousedown", () => {
	const err = (el: HTMLElement) => {
		[updateButton, el].forEach(e => {
			e.classList.add("err");
			setTimeout(() => e.classList.remove("err"), 500);
		});
	};

	const temp = parseFloat(tempIn.value);
	const rpm = parseFloat(rpmIn.value);
	const ph = parseFloat(phIn.value);
	if (temp)
		if (temp >= 25 && temp <= 35)
			client.publish("bioreactor/target_temp", tempIn.value + "");
		else err(tempIn);

	if (rpm)
		if (rpm >= 1000 && rpm <= 1500)
			client.publish("bioreactor/target_RPM", rpmIn.value + "");
		else err(rpmIn);

	if (ph)
		if (ph >= 3 && ph <= 7)
			client.publish("bioreactor/target_pH", phIn.value + "");
		else err(phIn);

	tempIn.value = "";
	rpmIn.value = "";
	phIn.value = "";
});
