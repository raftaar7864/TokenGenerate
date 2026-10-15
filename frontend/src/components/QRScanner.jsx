import { QrReader } from "react-qr-reader";

export default function QRScanner({ onScan }) {
  return (
    <div style={{ width: "300px" }}>
      <QrReader
        onResult={(result, error) => {
          if (!!result) {
            onScan(result?.text);
          }
        }}
        constraints={{ facingMode: "environment" }}
      />
    </div>
  );
}