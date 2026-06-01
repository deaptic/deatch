import { createAppController } from "./lib/primitives/createAppController";
import AppLayout from "./components/layout/AppLayout";
import Boundary from "./components/ui/Boundary";
import "./lib/events";
import "./App.css";

function App() {
  const controller = createAppController();
  return (
    <Boundary>
      <AppLayout controller={controller} />
    </Boundary>
  );
}

export default App;
