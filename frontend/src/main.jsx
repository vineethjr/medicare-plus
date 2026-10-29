import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import FindDoctor from "./pages/FindDoctor";
import DoctorAppointments from "./pages/DoctorAppointments";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorRecommendation from "./pages/DoctorRecommendation";
import DoctorConsultation from "./pages/DoctorConsultation";
import PatientMedicalRecords from "./pages/PatientMedicalRecords";
import DoctorMedicalRecords from "./pages/DoctorMedicalRecords";
import OnlineConsultation from "./pages/OnlineConsultation";
import PatientProfile from "./pages/PatientProfile";
import DoctorVerification from "./pages/DoctorVerification";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/patient-dashboard"
          element={<PatientDashboard />}
        />
        <Route
          path="/doctor-dashboard"
          element={<DoctorDashboard />}
        />
        <Route
          path="/doctor-profile"
          element={<DoctorProfile />}
        />
        <Route path="/find-doctor" element={<FindDoctor />} />
        <Route
  path="/doctor-appointments"
  element={<DoctorAppointments />}
/>
<Route
  path="/patient-appointments"
  element={<PatientAppointments />}
/>
<Route
  path="/doctor-recommendation"
  element={<DoctorRecommendation />}
/>
<Route
  path="/doctor-consultation"
  element={<DoctorConsultation />}
/>
<Route
  path="/patient-medical-records"
  element={<PatientMedicalRecords />}
/>
<Route
  path="/doctor-medical-records"
  element={<DoctorMedicalRecords />}
/>
<Route
  path="/online-consultation/:appointmentId"
  element={<OnlineConsultation />}
/>
<Route
  path="/consultation/:appointmentId"
  element={<OnlineConsultation />}
/>
<Route
  path="/patient-profile"
  element={<PatientProfile />}
/>
<Route
  path="/verify-doctor/:id"
  element={<DoctorVerification />}
/>
<Route
  path="/verify/doctor/:id"
  element={<DoctorVerification />}
/>
      </Routes>
      
    </BrowserRouter>
  </React.StrictMode>
);