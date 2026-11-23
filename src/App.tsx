import { createAppController } from "./app/createAppController.ts";
import AppLayout from "./app/AppLayout.tsx";
import Boundary from "./kit/Boundary.tsx";
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
