import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routeConfig/Routes";

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
