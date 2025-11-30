import AxiomUI from "./AxiomUI/AxiomUI";

declare module "#ui-types" {
	interface ComponentPropMap {
		dashboard: {
			reactor: {
				window: {
					start: number;
					end: number;
					seconds: number;
					samples: number;
				};
				temperature_C: {
					mean: number;
					min: number;
					max: number;
				};
				pH: {
					mean: number;
					min: number;
					max: number;
				};
				rpm: {
					mean: number;
					min: number;
					max: number;
				};
				actuators_avg: {
					heater_pwm: number;
					motor_pwm: number;
					acid_pwm: number;
					base_pwm: number;
				};
				dosing_l: {
					acid: number;
					base: number;
				};
				heater_energy_Wh: number;
				photoevents: number;
				setpoints: { temperature_C: number; pH: number; rpm: number };
				faults: {
					last_active: { name: string; id: null }[];
					counts: Record<string, number>;
				};
			};
		};
		button: {
			text: string;
			onclick?: () => void;
		};
	}
}

AxiomUI.addType("button", {
	render: ({ props }, { el }) =>
		el("button", { className: "border shadow interactive" }, props.text),
});

AxiomUI.addType("dashboard", {
	render: ({ props }, { el, formatDate }) =>
		el(
			"div",
			{ id: "dashboard", className: "border shadow" },
			el("h1", {}, "Bioreactor Dashboard"),
			el(
				"div",
				{ className: "date-panel" },
				el(
					"p",
					{},
					"Latest: " +
						(props.reactor
							? formatDate(
									new Date(),
									"dddd Do MMMM YYYY, HH:mm:ss",
								)
							: "never"),
				),
				el(
					"div",
					{ className: "buttons" },
					AxiomUI.render({
						type: "button",
						props: { text: "Import data" },
					}).element,
					AxiomUI.render({
						type: "button",
						props: { text: "Export data" },
					}).element,
				),
			),
			el("pre", {}, JSON.stringify(props.reactor, undefined, 4)),
		),
});

export const dashboard = AxiomUI.render({
	type: "dashboard",
	props: { reactor: null },
});
