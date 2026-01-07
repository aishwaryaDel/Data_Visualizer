import './App.css';
import NavBar from './components/Navbar';
import Main from './components/Main';

function App() {
  return (
    <div className="App bg-black h-screen w-screen overflow-hidden">
      <NavBar />

      {/* Container that will hold main content */}
      <Main />
    </div>
  );
}

export default App;
