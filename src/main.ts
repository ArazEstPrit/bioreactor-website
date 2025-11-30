import AxiomUI from "./AxiomUI/AxiomUI";
import { dashboard } from "./dashboard";
import "./index.css";
import mqtt from "mqtt";

// Can't connect to dummy client directly because it only supports mqtt, which
// we can't connect to from the browser
// const client = mqtt.connect("mqtt://engf0001.cs.ucl.ac.uk");
const client = mqtt.connect("wss://test.mosquitto.org:8081");

document.body.append(dashboard.element);

client.on("connect", () => {
	// client.subscribe("bioreactor_sim/nofaults/telemetry/summary");
	client.subscribe("bioreactor/summary");
});

client.on("message", (_, message) => {
	dashboard.props.reactor = JSON.parse("" + message);
});

window["AxiomUI"] = AxiomUI;
