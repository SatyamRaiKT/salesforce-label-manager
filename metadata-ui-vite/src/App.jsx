import Dashboard from './components/Dashboard';
import LabelTable from './components/LabelTable';

function App() {
  return (
    <div className="min-h-screen w-full bg-[#f9fafb] flex flex-col items-center px-4 sm:px-6 lg:px-16 py-6 sm:py-10">
      <div className="w-full max-w-screen-xl space-y-10">
        <Dashboard />
        <LabelTable />
      </div>
    </div>
  );
}

export default App;
