import { Link } from "react-router-dom";
import Routes from "./Routes";

export default function App() {
	return (
		<div className="min-h-screen flex flex-col">
			<nav className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between w-full">
						<div className="flex-shrink-0 flex items-center">
							<Link
								to="/"
								className="text-xl font-bold text-gray-800 hover:text-gray-900"
							>
								Scratch
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<Link
								to="/signup"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Signup
							</Link>
							<Link
								to="/login"
								className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Login
							</Link>
						</div>
					</div>
				</div>
			</nav>
			<main className="flex-1">
				<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
					<Routes />
				</div>
			</main>
		</div>
	);
}
