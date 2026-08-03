import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Inbox from "./pages/Inbox";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="/inbox" element={<Inbox />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
