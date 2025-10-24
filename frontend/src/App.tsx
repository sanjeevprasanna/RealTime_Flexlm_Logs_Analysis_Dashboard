import "./App.css";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import LivePage from "./pages/LivePage";
import DenialPage from "./pages/DenialPage.tsx";
import WaitPage from "./pages/WaitPage.tsx";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="bg-grey-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/subscriptions" element={<SubscriptionsPage />}></Route>
        <Route path="/live" element={<LivePage />}></Route>
        <Route path="/denial" element={<DenialPage />}></Route>
        <Route path="/wait" element={<WaitPage />}></Route>
      </Routes>
    </div>
  );
}

export default App;
