import { useState } from "react";
import Papa from "papaparse";
import { getDatabase, ref, set } from "firebase/database";
import { initializeApp } from "firebase/app";

// Firebase Configuration (Replace with your credentials)
const firebaseConfig = {
  apiKey: "AIzaSyArvC1YDkwapW4Fqcq6By2aMGfGTByx4QA",
  authDomain: "devgram-2.firebaseapp.com",
  projectId: "devgram-2",
  storageBucket: "devgram-2.firebasestorage.app",
  messagingSenderId: "605517421296",
  appId: "1:605517421296:web:e990718c43cc910d084035"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function CSVUploader() {
  const [uploadStatus, setUploadStatus] = useState("");

  interface CSVRow {
    "Unique ID": string;
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const ids = results.data.map((row) => row["Unique ID"]).filter(Boolean);

          if (ids.length > 0) {
            await set(ref(db, "validQRs"), ids.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
            setUploadStatus("✅ CSV uploaded successfully!");
          } else {
            setUploadStatus("⚠️ No valid Unique IDs found in CSV.");
          }
        },
      });
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Upload CSV File</h2>
      <input title="1" type="file" accept=".csv" onChange={handleFileUpload} className="p-2 border rounded mb-2" />
      {uploadStatus && <p className="mt-2 text-lg">{uploadStatus}</p>}
    </div>
  );
}
