import './App.css';
import { useState } from 'react';
import QRCodeVerifier from './components/qrscanner';
import CSVUploader from './components/csvupload'; 
import QRCodeGenerator from './components/qrgenerator';


function App() { 
  const [upload, setUpload] = useState(false); 

  const handleUpload = () => {
    setUpload(!upload);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <button 
        onClick={handleUpload} 
        className="p-2 mb-4 bg-blue-500 text-white rounded"
      >
        {upload ? "Go to Scanner" : "Upload CSV"}
      </button>

      {!upload ? <QRCodeVerifier /> :<div> <CSVUploader /></div>}
      <QRCodeGenerator/>
    </div>
  );
}

export default App;
