const express = require("express");

const router = express.Router();

// POST /api/recommendations
router.post("/", (req, res) => {
  try {
    const { symptoms } = req.body;

    // Validate input
    if (!symptoms || symptoms.trim() === "") {
      return res.status(400).json({
        message: "Please enter your symptoms.",
      });
    }

    const text = symptoms.toLowerCase();

    let specialization = "General Physician";
    let reason =
      "Your symptoms are best evaluated initially by a general physician.";

    // 1. Skin-related symptoms
    if (
      text.includes("skin") ||
      text.includes("rash") ||
      text.includes("acne") ||
      text.includes("itching") ||
      text.includes("pimple")
    ) {
      specialization = "Dermatologist";

      reason =
        "Your symptoms appear to be related to a skin condition.";
    }

    // 2. Heart-related symptoms
    else if (
      text.includes("chest pain") ||
      text.includes("heart") ||
      text.includes("palpitation") ||
      text.includes("heartbeat")
    ) {
      specialization = "Cardiologist";

      reason =
        "Your symptoms may require evaluation of the cardiovascular system.";
    }

    // 3. Eye-related symptoms
    else if (
      text.includes("eye") ||
      text.includes("vision") ||
      text.includes("blurred") ||
      text.includes("sight")
    ) {
      specialization = "Ophthalmologist";

      reason =
        "Your symptoms appear to involve vision or eye-related problems.";
    }

    // 4. Dental-related symptoms
    else if (
      text.includes("tooth") ||
      text.includes("teeth") ||
      text.includes("gum") ||
      text.includes("dental")
    ) {
      specialization = "Dentist";

      reason =
        "Your symptoms appear to be related to dental or oral health.";
    }

    // 5. Bone and joint symptoms
    else if (
      text.includes("bone") ||
      text.includes("joint") ||
      text.includes("fracture") ||
      text.includes("back pain") ||
      text.includes("knee pain")
    ) {
      specialization = "Orthopedist";

      reason =
        "Your symptoms appear to involve bones, joints, or the musculoskeletal system.";
    }

    // 6. Mental health symptoms
    else if (
      text.includes("anxiety") ||
      text.includes("stress") ||
      text.includes("depression") ||
      text.includes("panic") ||
      text.includes("mental")
    ) {
      specialization = "Psychiatrist";

      reason =
        "Your symptoms may benefit from professional mental health evaluation.";
    }

    // 7. Women's health
    else if (
      text.includes("pregnancy") ||
      text.includes("period") ||
      text.includes("menstrual") ||
      text.includes("ovarian")
    ) {
      specialization = "Gynecologist";

      reason =
        "Your symptoms appear to involve women's reproductive health.";
    }

    // 8. General illness
    // IMPORTANT: This is checked before ENT so that
    // "fever, cough and sore throat" is handled as
    // a general illness rather than only matching "throat".
    else if (
      text.includes("fever") ||
      text.includes("cough") ||
      text.includes("cold") ||
      text.includes("headache") ||
      text.includes("vomiting") ||
      text.includes("diarrhea")
    ) {
      specialization = "General Physician";

      reason =
        "Your symptoms are commonly evaluated initially by a general physician.";
    }

    // 9. Ear, Nose and Throat
    else if (
      text.includes("ear") ||
      text.includes("throat") ||
      text.includes("sinus") ||
      text.includes("tonsil")
    ) {
      specialization = "ENT Specialist";

      reason =
        "Your symptoms appear to involve the ear, nose, or throat.";
    }

    // Return recommendation
    return res.json({
      success: true,
      specialization,
      reason,
      symptoms,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    return res.status(500).json({
      message: "Unable to process symptoms.",
    });
  }
});

module.exports = router;