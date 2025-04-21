import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getDatabase, ref, get, set, onValue } from "firebase/database";

export default function QRCodeVerifier() {
  const [status, setStatus] = useState("");
  const [validIds, setValidIds] = useState(new Set());
  const [scannedIds, setScannedIds] = useState(new Set());

  const db = getDatabase();

  useEffect(() => {
    // Fetch valid QR codes from Firebase
    get(ref(db, "validQRs")).then((snapshot) => {
      if (snapshot.exists()) {
        setValidIds(new Set(Object.keys(snapshot.val())));
      }
    });

    // Sync scanned QR codes in real-time
    const scannedRef = ref(db, "scannedQRs");
    onValue(scannedRef, (snapshot) => {
      setScannedIds(new Set(Object.keys(snapshot.val() || {})));
    });
  }, []);

  const startScanner = () => {
    const qrScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    qrScanner.render(
      async (decodedText) => {
        if (scannedIds.has(decodedText)) {
          setStatus("⚠️ QR Code already scanned!");
        } else if (validIds.has(decodedText)) {
          await set(ref(db, `scannedQRs/${decodedText}`), { scannedAt: new Date().toISOString() });
          setStatus("✅ Success: QR Code is valid!");
        } else {
          setStatus("❌ Error: Invalid QR Code");
        }
        qrScanner.clear();
      },
      (errorMessage) => {
        console.error(`QR Code scan error: ${errorMessage}`);
      }
    );
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold">QR Code Verifier</h1>
      <div id="reader" className="my-4"></div>
      <button onClick={startScanner} className="p-2 bg-blue-500 text-white rounded">
        Start Scanning
      </button>
      {status && <p className="mt-4 text-lg">{status}</p>}
    </div>
  );
}
