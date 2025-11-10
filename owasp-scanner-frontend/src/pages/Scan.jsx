import React, { useState } from "react";
import ProgressBar from "../components/ProgressBar";
import ResultCard from "../components/ResultCard";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import axios from "axios";

// ✅ FIREBASE IMPORTS
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const Scan = () => {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("simulated");
  const [consent, setConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const validateURL = (value) =>
    /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-]*)*\/?$/.test(value);

  const resetScan = () => {
    setUrl("");
    setError("");
    setScanning(false);
    setProgress(0);
    setResults(null);
    setConsent(false);
    setHasScanned(false);
  };

  // ✅ FIRESTORE SAVE FUNCTION
  const saveScanToDB = async (resultData) => {
    try {
      const user = auth.currentUser;
      if (!user) return console.log("User not logged in. Not saving scan.");

      await addDoc(collection(db, "scans"), {
        userId: user.uid,
        url: resultData.url,
        score: resultData.score || null,
        vulnerabilities: resultData.vulnerabilities || [],
        status: "Success",
        mode: mode,
        timestamp: serverTimestamp(),
      });

      console.log("Scan successfully saved to firestore.");
    } catch (err) {
      console.error("Error saving scan:", err);
    }
  };

  const startScan = async () => {
    if (!url.trim()) return setError("Please enter a URL.");
    if (!validateURL(url)) return setError("Invalid URL format.");
    if (!consent) return;

    setShowConsentModal(false);
    setError("");
    setScanning(true);
    setProgress(0);
    setResults(null);
    setHasScanned(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setProgress(current);
    }, 300);

    setTimeout(async () => {
      clearInterval(interval);
      setProgress(100);

      let finalResults = null;

      if (mode === "simulated") {
        // Simulated results
        const fakeResults = [
          /* ... same fakeResults as before ... */
        ];

        const score =
          100 -
          fakeResults.reduce((acc, vuln) => {
            if (vuln.severity === "Critical") return acc + 10;
            if (vuln.severity === "High") return acc + 7;
            if (vuln.severity === "Medium") return acc + 5;
            return acc + 2;
          }, 0);

        setResults({ url, score, vulnerabilities: fakeResults });
      } else {
        try {
          const res = await axios.post(`${BACKEND_URL}/api/scan`, {
            url,
            apiKey: "demo-key-123",
            allowActive: true,
            consent: true,
          });
          finalResults = res.data;
          setResults(finalResults);
        } catch (err) {
          setError("Error connecting to scan API.");
        }
      }

      // ✅ SAVE TO FIRESTORE
      if (finalResults) saveScanToDB(finalResults);

      setScanning(false);
      setHasScanned(true);
    }, 3000);
  };

  const handleScanClick = () => {
    if (!url.trim() || !validateURL(url)) {
      setError("Please enter a valid URL before scanning.");
      return;
    }
    setShowConsentModal(true);
  };

  const downloadReport = (fileUrl) => {
    const link = document.createElement("a");
    link.href = `${BACKEND_URL}${fileUrl}`;
    link.download = fileUrl.split("/").pop();
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center py-12">
      <motion.h1
        className="text-3xl font-bold text-cyan-400 mb-6 flex items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Shield className="w-7 h-7 text-cyan-400" /> Vulnerability Scan
      </motion.h1>

      {/* Input Section */}
      {!results && (
        <div className="bg-[#111] p-6 rounded-xl shadow-lg w-[90%] md:w-[500px] border border-cyan-500/20">
          <input
            type="text"
            placeholder="Enter target URL (e.g., https://example.com)"
            className="w-full p-3 rounded-md bg-[#0a0a0a] text-white outline-none border border-cyan-400/30 focus:border-cyan-400"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <div className="flex gap-2">
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="simulated"
                  checked={mode === "simulated"}
                  onChange={() => setMode("simulated")}
                  className="accent-cyan-400"
                />
                Simulated
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="real"
                  checked={mode === "real"}
                  onChange={() => setMode("real")}
                  className="accent-cyan-400"
                />
                Real
              </label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <button
            onClick={handleScanClick}
            disabled={scanning}
            className="w-full mt-5 py-3 bg-cyan-500 text-black font-semibold rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
          >
            {scanning
              ? "Scanning..."
              : hasScanned
              ? "Re-Scan New URL"
              : "Start Scan"}
          </button>
        </div>
      )}

      {/* Re-scan Button */}
      {results && (
        <button
          onClick={resetScan}
          className="mt-5 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
        >
          Re-Scan New URL
        </button>
      )}

      {/* Progress Display */}
      {scanning && (
        <div className="w-[90%] md:w-[500px] mt-6">
          <ProgressBar progress={progress} />
          <p className="text-gray-400 text-sm mt-2 text-center">
            🔍 Scanning in progress... please wait
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <motion.div
          className="w-[90%] md:w-[700px] mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-[#111] p-6 rounded-xl border border-cyan-500/30 shadow-md mb-6">
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">
              Scan Summary
            </h2>
            <p className="text-gray-400 mb-2">
              🌐 Target: <span className="text-cyan-400">{results.url}</span>
            </p>
            <p className="text-gray-300 mb-1">
              🧠 Security Score:
              <span className="text-cyan-400 font-semibold">
                {" "}
                {results.score} / 100
              </span>
            </p>
            <p className="text-gray-300">
              ⚠ Vulnerabilities Found:
              <span className="text-red-400 font-semibold">
                {" "}
                {results.vulnerabilities.length}
              </span>
            </p>

            {results.jsonReport && results.pdfReport && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => downloadReport(results.jsonReport)}
                  className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400"
                >
                  Download JSON
                </button>
                <button
                  onClick={() => downloadReport(results.pdfReport)}
                  className="px-4 py-2 bg-green-500 rounded hover:bg-green-400"
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.vulnerabilities.map((vuln, i) => (
              <ResultCard key={i} vulnerability={vuln} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#111] rounded-xl p-6 w-[90%] max-w-md shadow-lg border border-cyan-500/30"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="text-xl font-bold text-cyan-400 mb-4">
                Consent Required
              </h2>
              <p className="text-gray-300 mb-4 text-sm">
                By scanning a website, you confirm that you have permission to
                perform security tests on this target and agree to ethical
                scanning practices.
              </p>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={() => setConsent(!consent)}
                  className="accent-cyan-400"
                />
                I agree to the ethical scanning terms.
              </label>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={startScan}
                  disabled={!consent}
                  className="px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-400"
                >
                  Start Scan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scan;
