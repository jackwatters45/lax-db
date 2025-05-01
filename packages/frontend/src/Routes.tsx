import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home.tsx";
import Signup from "./containers/Signup.tsx";
import Login from "./containers/Login.tsx";
import NotFound from "./containers/NotFound.tsx";

export default function Links() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
		</Routes>
	);
}
