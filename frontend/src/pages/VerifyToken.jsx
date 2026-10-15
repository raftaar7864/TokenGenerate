
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { BrowserMultiFormatReader } from "@zxing/browser";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "");

const API = `${API_BASE}/api/tokens`;

const dateText = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "N/A";

const isBackCamera = (label = "") =>
  /back|rear|environment|world|trasera|trasero|后置|背面/i.test(label);

export default function VerifyToken() {
  const [selected, setSelected] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [paidTokens, setPaidTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState("");

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  // Load paid tokens.
  const fetchPaid = useCallback(async () => {
    try {
      const { data } = await axios.get(API);

      const list = data
        .filter((token) => token.paymentStatus === "Paid")
        .sort(
          (a, b) =>
            new Date(b.paidAt || 0) - new Date(a.paidAt || 0)
        );

      setPaidTokens(list);
      setFilteredTokens(list);
    } catch {
      setNotice("Unable to load paid tokens. Check the API connection.");
    }
  }, []);

  // Verify a manually entered or QR-scanned token.
  const verifyToken = useCallback(async (tokenNumber) => {
    const token = String(tokenNumber || "").trim();

    if (!token) {
      setNotice("Please enter or scan a token number.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const { data } = await axios.get(
        `${API}/${encodeURIComponent(token)}`
      );

      setSelected(data);
      setScanInput(data.tokenNumber);

      if (data.paymentStatus !== "Paid") {
        setConfirmPopup(true);
      } else {
        setConfirmPopup(false);
        setNotice("This token is already marked as paid.");
      }
    } catch (error) {
      setSelected(null);
      setConfirmPopup(false);

      setNotice(
        error.response?.status === 404
          ? "Token not found. Check the number and scan again."
          : error.response
            ? error.response.data?.error || "Token verification failed."
            : "Unable to connect to the server. Check your API connection."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    fetchPaid();
  }, [fetchPaid]);

  // Request camera permission, identify available cameras,
  // and prefer the rear-facing camera.
  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;
    let permissionStream;

    const initializeCameras = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not supported by this browser.");
        }

        permissionStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        const initialDeviceId =
          permissionStream.getVideoTracks()[0]?.getSettings()?.deviceId;

        if (cancelled) return;

        // Release the permission stream before the QR reader starts.
        permissionStream.getTracks().forEach((track) => track.stop());
        permissionStream = null;

        const devices =
          await BrowserMultiFormatReader.listVideoInputDevices();

        if (cancelled) return;

        if (!devices.length) {
          throw new Error("No camera was found on this device.");
        }

        setCameraDevices(devices);

        const rearCamera = devices.find((device) =>
          isBackCamera(device.label)
        );

        const preferredCamera =
          rearCamera ||
          devices.find((device) => device.deviceId === initialDeviceId) ||
          devices[0];

        setActiveCameraId(preferredCamera.deviceId);
      } catch (error) {
        permissionStream?.getTracks().forEach((track) => track.stop());

        if (cancelled) return;

        console.error("Camera initialization failed:", error);

        setNotice(
          error.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings."
            : error.name === "NotFoundError"
              ? "No camera was found on this device."
              : error.message ||
                "Unable to open the camera. Check camera permissions and try again."
        );

        setCameraOpen(false);
      }
    };

    initializeCameras();

    return () => {
      cancelled = true;
      permissionStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOpen]);

  // Start or restart the QR scanner whenever the selected camera changes.
  useEffect(() => {
    if (!cameraOpen || !activeCameraId || !videoRef.current) return;

    let cancelled = false;
    let hasScanned = false;
    let localControls = null;

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(
        activeCameraId,
        videoRef.current,
        (result, error, controls) => {
          if (controls && !localControls) {
            localControls = controls;
            controlsRef.current = controls;
          }

          if (cancelled || hasScanned || !result) return;

          hasScanned = true;

          const tokenNumber = result.getText().trim();

          localControls?.stop();
          controlsRef.current?.stop();
          controlsRef.current = null;

          setCameraOpen(false);
          setActiveCameraId("");
          setScanInput(tokenNumber);

          if (tokenNumber) {
            verifyToken(tokenNumber);
          } else {
            setNotice("No token number found in the QR code.");
          }
        }
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
        } else {
          localControls = controls;
          controlsRef.current = controls;
        }
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("QR scanner error:", error);

        setNotice(
          "Unable to start this camera. Try switching cameras or check camera permissions."
        );

        setCameraOpen(false);
      });

    return () => {
      cancelled = true;

      localControls?.stop();

      if (controlsRef.current === localControls) {
        controlsRef.current = null;
      }
    };
  }, [cameraOpen, activeCameraId, verifyToken]);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOpen(false);
    setActiveCameraId("");
  };

  // Switch between available cameras.
  const switchCamera = () => {
    if (cameraDevices.length < 2) return;

    const currentIndex = cameraDevices.findIndex(
      (device) => device.deviceId === activeCameraId
    );

    const nextIndex = (currentIndex + 1) % cameraDevices.length;

    setNotice("");
    setActiveCameraId(cameraDevices[nextIndex].deviceId);
  };

  const handleScan = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    if (!loading) {
      verifyToken(scanInput);
    }
  };

  // Confirm payment.
  const confirmMarkPaid = async () => {
    if (!selected || loading) return;

    setLoading(true);

    try {
      const { data } = await axios.put(
        `${API}/pay/${encodeURIComponent(selected.tokenNumber)}`
      );

      setSelected(data);
      setConfirmPopup(false);
      setNotice("Payment confirmed successfully.");

      await fetchPaid();
    } catch (error) {
      setNotice(
        error.response?.data?.error || "Payment could not be updated."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Filter paid tokens by date.
  const applyFilter = () => {
    let list = [...paidTokens];

    if (fromDate) {
      list = list.filter(
        (token) =>
          token.paidAt &&
          new Date(token.paidAt) >= new Date(`${fromDate}T00:00:00`)
      );
    }

    if (toDate) {
      list = list.filter(
        (token) =>
          token.paidAt &&
          new Date(token.paidAt) <= new Date(`${toDate}T23:59:59.999`)
      );
    }

    setFilteredTokens(list);
  };

  const filterToday = () => {
    const today = new Date();

    const key = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    setFromDate(key);
    setToDate(key);

    setFilteredTokens(
      paidTokens.filter((token) => {
        if (!token.paidAt) return false;

        const date = new Date(token.paidAt);

        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        );
      })
    );
  };

  const clearFilter = () => {
    setFromDate("");
    setToDate("");
    setFilteredTokens(paidTokens);
  };

  return (
    <>
      {/* Token input and camera scanner */}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Scan or enter a token</h2>
            <p
              className="muted"
              style={{ fontSize: 13, margin: "6px 0 0" }}
            >
              Scan a QR code using your camera or scanner, or enter the token
              number manually.
            </p>
          </div>

          <span className="pill">LIVE VERIFICATION</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          <input
            ref={inputRef}
            className="scanner-input"
            value={scanInput}
            onChange={(event) => setScanInput(event.target.value)}
            onKeyDown={handleScan}
            placeholder="Scan token / enter token number and press Enter"
            aria-label="Scan or enter token number"
            disabled={loading}
            style={{ flex: "1 1 260px", minWidth: 0 }}
          />

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setNotice("");
              setCameraDevices([]);
              setActiveCameraId("");
              setCameraOpen(true);
            }}
            disabled={loading || cameraOpen}
          >
            <span aria-hidden="true">▣</span> Open Camera &amp; Scan QR
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => verifyToken(scanInput)}
            disabled={loading || !scanInput.trim()}
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </div>

        {notice && (
          <div
            className="notice"
            role="status"
            style={{ marginTop: 14 }}
          >
            {notice}
          </div>
        )}

        {/* Camera modal */}
        {cameraOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-title"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "#111827cc",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
          >
            <div
              className="panel"
              style={{
                width: "min(100%, 520px)",
                maxHeight: "90vh",
                overflowY: "auto",
                margin: 0,
              }}
            >
              <div
                className="panel-heading"
                style={{ flexWrap: "wrap", gap: 10 }}
              >
                <div>
                  <h2 id="camera-title">Scan token QR code</h2>
                  <p
                    className="muted"
                    style={{ fontSize: 13, marginTop: 6 }}
                  >
                    Hold the QR code inside the camera frame.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={stopCamera}
                  aria-label="Close camera"
                >
                  ✕ Close
                </button>
              </div>

              <div
                style={{
                  background: "#111827",
                  borderRadius: 14,
                  overflow: "hidden",
                  width: "100%",
                  minHeight: 200,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: "60vh",
                    objectFit: "contain",
                  }}
                />
              </div>

              <p
                className="muted"
                style={{ fontSize: 12, marginTop: 12 }}
              >
                {activeCameraId
                  ? `Camera ${Math.max(
                      1,
                      cameraDevices.findIndex(
                        (device) => device.deviceId === activeCameraId
                      ) + 1
                    )} of ${cameraDevices.length}. QR scanning is active.`
                  : "Requesting camera access…"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: "1 1 160px" }}
                  onClick={switchCamera}
                  disabled={
                    cameraDevices.length < 2 || !activeCameraId
                  }
                >
                  ↻ Switch Camera
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: "1 1 160px" }}
                  onClick={stopCamera}
                >
                  Cancel scanning
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Token details and paid-token report */}
      <div className="report-layout" style={{ alignItems: "start" }}>
        <section className="panel">
          <div className="panel-heading">
            <h2>Token details</h2>

            {selected && (
              <span
                className={`pill ${
                  selected.paymentStatus === "Paid" ? "paid" : "unpaid"
                }`}
              >
                {selected.paymentStatus || "Unpaid"}
              </span>
            )}
          </div>

          {selected ? (
            <>
              <div
                style={{
                  background: "#f5f3ff",
                  padding: 18,
                  borderRadius: 15,
                  marginBottom: 15,
                }}
              >
                <div className="eyebrow">TOKEN NUMBER</div>
                <div
                  style={{
                    font: "800 26px Manrope",
                    overflowWrap: "anywhere",
                  }}
                >
                  {selected.tokenNumber}
                </div>
              </div>

              <div className="token-detail">
                <div className="detail-cell">
                  <small>Category</small>
                  <strong>{selected.category || "—"}</strong>
                </div>

                <div className="detail-cell">
                  <small>Batch number</small>
                  <strong>{selected.batchNumber || "—"}</strong>
                </div>

                <div className="detail-cell">
                  <small>Valid until</small>
                  <strong>{dateText(selected.validUpto)}</strong>
                </div>

                <div className="detail-cell">
                  <small>Payment status</small>
                  <strong>{selected.paymentStatus || "Unpaid"}</strong>
                </div>

                <div
                  className="detail-cell"
                  style={{ gridColumn: "1/-1" }}
                >
                  <small>Paid date</small>
                  <strong>
                    {selected.paidAt
                      ? new Date(selected.paidAt).toLocaleString("en-GB")
                      : "Not paid yet"}
                  </strong>
                </div>
              </div>

              {selected.paymentStatus !== "Paid" && (
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={() => setConfirmPopup(true)}
                  disabled={loading}
                >
                  Confirm payment →
                </button>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: 32, marginBottom: 8 }}>⌁</div>
              <strong>No token selected</strong>
              <p>
                Scan or enter a token number above to see its details.
              </p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Paid tokens</h2>
              <p
                className="muted"
                style={{ fontSize: 12, margin: "6px 0 0" }}
              >
                {filteredTokens.length} records
              </p>
            </div>

            <span className="pill paid">✓ PAID</span>
          </div>

          <div className="form-grid">
            <div>
              <label htmlFor="from">From date</label>
              <input
                id="from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="to">To date</label>
              <input
                id="to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>

          <div
            className="form-actions"
            style={{ margin: "12px 0 18px" }}
          >
            <button
              className="btn btn-primary"
              onClick={applyFilter}
            >
              Apply filter
            </button>

            <button
              className="btn btn-outline"
              onClick={filterToday}
            >
              Today
            </button>

            <button
              className="btn btn-outline"
              onClick={clearFilter}
            >
              Clear
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Category</th>
                  <th>Valid</th>
                  <th>Paid at</th>
                </tr>
              </thead>

              <tbody>
                {filteredTokens.length ? (
                  filteredTokens.map((token) => (
                    <tr key={token.tokenNumber}>
                      <td>
                        <strong>{token.tokenNumber}</strong>
                      </td>
                      <td>{token.category}</td>
                      <td>{dateText(token.validUpto)}</td>
                      <td>
                        {token.paidAt
                          ? new Date(token.paidAt).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No paid tokens match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Payment confirmation */}
      {confirmPopup && selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "#11182780",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            className="panel"
            style={{ width: "min(100%, 420px)", margin: 0 }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <h2 id="confirm-title">Confirm payment?</h2>
            <p className="muted">
              Mark token <strong>{selected.tokenNumber}</strong> as paid?
              This updates its payment status.
            </p>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                disabled={loading}
                onClick={confirmMarkPaid}
              >
                {loading ? "Updating…" : "Yes, mark as paid"}
              </button>

              <button
                className="btn btn-outline"
                disabled={loading}
                onClick={() => setConfirmPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
