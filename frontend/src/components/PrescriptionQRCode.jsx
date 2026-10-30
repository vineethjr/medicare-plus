import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheckIcon, ExternalLinkIcon, CheckCircleIcon } from "./Icons";
import "./PrescriptionQRCode.css";

export default function PrescriptionQRCode({
  doctorId,
  doctorName = "Doctor",
  specialization = "Specialist",
  qualification = "MBBS",
  medicalLicense = "SMC-ACTIVE-REGISTRY",
  hospital = "Clinical Center",
  prescriptionId = null,
  size = 110,
  showCard = true,
  className = "",
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verificationUrl = `${baseUrl}/verify-doctor/${doctorId || 1}${
    prescriptionId ? `?prescription=${prescriptionId}` : ""
  }`;

  useEffect(() => {
    let isMounted = true;

    async function generateQR() {
      try {
        const url = await QRCode.toDataURL(verificationUrl, {
          width: Math.max(size * 2, 200),
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
        if (isMounted) {
          setQrDataUrl(url);
          setError(false);
        }
      } catch (err) {
        console.error("Failed to generate prescription QR code:", err);
        if (isMounted) setError(true);
      }
    }

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [verificationUrl, size]);

  if (!showCard) {
    return (
      <div className={`prescription-qr-minimal ${className}`}>
        {qrDataUrl ? (
          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Scan or click to verify doctor details"
          >
            <img
              src={qrDataUrl}
              alt={`QR verification for Dr. ${doctorName}`}
              width={size}
              height={size}
              className="qr-code-img"
            />
          </a>
        ) : error ? (
          <div className="qr-error-box" style={{ width: size, height: size }}>
            <span>QR Error</span>
          </div>
        ) : (
          <div className="qr-loading-box" style={{ width: size, height: size }}>
            <span className="qr-spinner"></span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`prescription-qr-card ${className}`}>
      <div className="qr-card-left">
        <div className="qr-img-frame">
          {qrDataUrl ? (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Click or scan to view verified doctor credentials"
            >
              <img
                src={qrDataUrl}
                alt={`QR verification code for Dr. ${doctorName}`}
                width={size}
                height={size}
                className="qr-code-img"
              />
            </a>
          ) : (
            <div className="qr-loading-box" style={{ width: size, height: size }}>
              <span className="qr-spinner"></span>
            </div>
          )}
          <span className="qr-scan-badge">SCAN TO VERIFY</span>
        </div>
      </div>

      <div className="qr-card-right">
        <div className="qr-header-badge">
          <ShieldCheckIcon size={14} className="text-teal" />
          <span>OFFICIAL DIGITAL PRESCRIPTION QR STAMP</span>
        </div>

        <h4 className="qr-doctor-name">
          Dr. {doctorName}
          <CheckCircleIcon size={13} className="text-emerald" />
        </h4>

        <div className="qr-meta-grid">
          <div className="qr-meta-item">
            <span className="qr-meta-label">Specialization:</span>
            <strong className="qr-meta-value">{specialization}</strong>
          </div>
          <div className="qr-meta-item">
            <span className="qr-meta-label">Qualification:</span>
            <strong className="qr-meta-value">{qualification}</strong>
          </div>
          <div className="qr-meta-item">
            <span className="qr-meta-label">Registration / License No:</span>
            <strong className="qr-meta-value text-teal">{medicalLicense || "SMC-VERIFIED"}</strong>
          </div>
          <div className="qr-meta-item">
            <span className="qr-meta-label">Hospital / Clinic:</span>
            <strong className="qr-meta-value">{hospital}</strong>
          </div>
        </div>

        <p className="qr-instruction-text">
          Scan this QR code with any camera or QR scanner to inspect authentic doctor credentials, medical license records, and prescription authenticity.
        </p>

        <a
          href={verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-open-verification"
        >
          <span>Open Secure Doctor Verification Page</span>
          <ExternalLinkIcon size={13} />
        </a>
      </div>
    </div>
  );
}

