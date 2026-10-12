import { createAppController } from "./lib/primitives/createAppController.ts";
import AppLayout from "./components/layout/AppLayout.tsx";
import Boundary from "./components/ui/Boundary.tsx";
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
