import './App.css';
import NavBar from './components/Navbar';
import Main from './components/Main';

function App() {
  return (
    <div className="App bg-black h-screen w-screen">
      <NavBar />

      {/* Container that will hold main content */}
      <Main />
    </div>
  );
}

export default App;
