/* @refresh reload */
import { render } from "solid-js/web";
import { LANGUAGES, setLocale } from "../shared/i18n/index.ts";
import WidgetApp from "./WidgetApp.tsx";
import "./widget.css";

const params = new URLSearchParams(location.search);
const id = params.get("id");
const server = params.get("server");
const root = document.getElementById("root");
if (!root || !id || !server) {
  throw new Error("widget.html needs #root and the id and server parameters");
}
const language = LANGUAGES.find((l) => l === params.get("lang"));
if (language) setLocale(language);
const preview = params.has("preview");
if (preview) document.documentElement.dataset.preview = "";
render(
  () => <WidgetApp socketUrl={`ws://${server}/ws/${id}`} preview={preview} />,
  root,
);
