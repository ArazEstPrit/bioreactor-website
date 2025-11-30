import AxiomUI from "./AxiomUI/AxiomUI";
import "./index.css";
import mqtt from "mqtt";

// Can't connect to dummy client directly because it only supports mqtt, which
// we can't connect to from the browser
// const client = mqtt.connect("mqtt://engf0001.cs.ucl.ac.uk");
const client = mqtt.connect("wss://test.mosquitto.org:8081");

AxiomUI.addType("app", {
	render: ({ props }, { el }) =>
		el(
			"div",
			{ id: "app" },
			el("h1", {}, "bioreactor"),
			el("pre", {}, props.reactor),
		),
});

const app = AxiomUI.render({ type: "app", props: { reactor: "" } });

document.body.append(app.element);

client.on("connect", () => {
	// client.subscribe("bioreactor_sim/nofaults/telemetry/summary");
	client.subscribe("bioreactor/#");
});

client.on("message", (topic, message) => {
	app.props.reactor = String(message);
});

declare module "#components" {
	interface ComponentPropMap {
		app: {
			reactor: string;
		};
	}
}
