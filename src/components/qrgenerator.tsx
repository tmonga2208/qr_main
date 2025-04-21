import { useState } from "react";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import QRCode from "qrcode";

interface CSVRow {
  NAME: string;
  "Unique ID"?: string;
  "QR Code Path"?: string;
}

interface EventDetails {
  location: string;
  time: string;
  imageFile: string | null;
}

export default function QRCodeGenerator() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails>({ location: "", time: "", imageFile: null });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const enrichedData = results.data.map((row) => ({
            ...row,
            "Unique ID": crypto.randomUUID(),
          }));
          setCsvData(enrichedData);
        },
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          setEventDetails((prev) => ({ ...prev, imageFile: e.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAllTickets = async () => {
    if (csvData.length === 0) return;

    const zip = new JSZip();
    const csvOutput: CSVRow[] = [];
    const imagePromises: Promise<void>[] = [];

    for (const row of csvData) {
      const qrDataUrl = await QRCode.toDataURL(row["Unique ID"] || "");
      
      const ticket = document.createElement("div");
      ticket.style.width = "400px";
      ticket.style.height = "600px";
      ticket.style.position = "relative";
      ticket.style.display = "flex";
      ticket.style.justifyContent = "center";
      ticket.style.alignItems = "flex-end";
      ticket.style.overflow = "hidden";
      ticket.style.background = "black";

      if (eventDetails.imageFile) {
        const eventImg = new Image();
        eventImg.src = eventDetails.imageFile;
        eventImg.style.position = "absolute";
        eventImg.style.top = "0";
        eventImg.style.left = "0";
        eventImg.style.width = "100%";
        eventImg.style.height = "100%";
        eventImg.style.objectFit = "cover";
        ticket.appendChild(eventImg);
      }

      const bottomContainer = document.createElement("div");
      bottomContainer.style.position = "absolute";
      bottomContainer.style.bottom = "20px";
      bottomContainer.style.left = "50%";
      bottomContainer.style.transform = "translateX(-50%)";
      bottomContainer.style.textAlign = "center";
      bottomContainer.style.background = "rgba(0, 0, 0, 0.5)";
      bottomContainer.style.padding = "10px";
      bottomContainer.style.borderRadius = "10px";

      const name = document.createElement("h3");
      name.innerText = row.NAME;
      name.style.color = "white";
      name.style.marginBottom = "5px";

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      qrImg.style.width = "100px";
      qrImg.style.height = "100px";
      
      bottomContainer.appendChild(name);
      bottomContainer.appendChild(qrImg);
      ticket.appendChild(bottomContainer);
      document.body.appendChild(ticket);
      
      await new Promise((resolve) => setTimeout(resolve, 500));

      imagePromises.push(
        html2canvas(ticket).then((canvas) => {
          document.body.removeChild(ticket);
          const dataUrl = canvas.toDataURL("image/png");
          const ticketFilename = `${row.NAME}_ticket.png`;
          zip.file(ticketFilename, dataUrl.split(",")[1], { base64: true });
          csvOutput.push({ NAME: row.NAME, "Unique ID": row["Unique ID"], "QR Code Path": ticketFilename });
        })
      );
    }

    await Promise.all(imagePromises);
    
    const csvBlob = new Blob([Papa.unparse(csvOutput)], { type: "text/csv" });
    zip.file("output.csv", csvBlob);
    
    zip.generateAsync({ type: "blob" }).then((zipBlob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "tickets.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold">QR Code Ticket Generator</h1>
      <input title="one" type="file" accept=".csv" onChange={handleFileUpload} className="my-4" />
      <input title="two" type="file" accept="image/*" onChange={handleImageUpload} className="my-2 p-2 border rounded" />
      <button onClick={generateAllTickets} className="my-4 p-2 bg-blue-500 text-white rounded">Generate All Tickets</button>
    </div>
  );
}
