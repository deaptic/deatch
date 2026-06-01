import { createAppController } from "./lib/primitives/createAppController";
import AppLayout from "./components/layout/AppLayout";
import "./lib/events";
import "./App.css";

function App() {
  const controller = createAppController();
  return <AppLayout controller={controller} />;
}

export default App;
