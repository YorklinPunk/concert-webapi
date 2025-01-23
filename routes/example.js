const express = require("express");
const axios = require("axios");
const router = express.Router();
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Configuración de transporte de correo
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "zetita159@gmail.com", // Cambia esto por tu correo
    pass: "itfh nxuc fcos jmgi" // Contraseña de aplicación (ver nota abajo)
  }
});

async function generateQRAndSendEmail(data) {
  try {
    // Generar el QR y guardarlo
    const qrFileName = `qr_${data.IdColumn}.png`;
    const qrFilePath = path.join(__dirname, "../public/images", qrFileName);
    await QRCode.toFile(qrFilePath, JSON.stringify(data));

    // Configurar el contenido del correo
    const mailOptions = {
      from: "zetita159@gmail.com", // Correo del remitente
      to: data["Correo electrónico"], // Destinatario
      subject: "Código QR Generado",
      text: `Hola ${data.Nombres} ${data.Apellidos}, aquí tienes tu código QR generado.`,
      attachments: [
        {
          filename: qrFileName,
          path: qrFilePath
        }
      ]
    };
    
    console.log(mailOptions)

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "QR generado y enviado por correo con éxito.",
      filePath: qrFilePath
    };
  } catch (error) {
    console.error("Error al generar o enviar el QR:", error);
    return {
      success: false,
      message: "Error al generar o enviar el QR.",
      error: error.message
    };
  }
}
// Endpoint to fetch participants data from Apps Script
router.get("/", async (req, res) => {
  try {
    const scriptUrl = "https://script.googleusercontent.com/macros/echo?user_content_key=9yzEuoO398kD-kdUYZdo8Rm4TfLfDvV807aSEo24tZeckhtXBpaYoeT229PfCUcfe9nlzi2wYDt50Xoeif26pBYfeXbgDD5om5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnLmAXRWGdKu6rC9-nKHq4sTLnWsbyhNtg6t_dvtyZnro_pQhf7RuusB81vMJk5vT6WxP0IYEeef5gi3AOKFzO4zF15PEdb5pbdz9Jw9Md8uu&lib=M4zWjbcaVN7pqnKsV-vY-cRK3RNb248HK";
    const response = await axios.get(scriptUrl);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from Google Apps Script:", error);
    res.status(500).json({ error: "Failed to fetch participants data" });
  }
});

router.get("/:codigo", async (req, res) => {
  try {
    const scriptUrl = "https://script.googleusercontent.com/macros/echo?user_content_key=9yzEuoO398kD-kdUYZdo8Rm4TfLfDvV807aSEo24tZeckhtXBpaYoeT229PfCUcfe9nlzi2wYDt50Xoeif26pBYfeXbgDD5om5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnLmAXRWGdKu6rC9-nKHq4sTLnWsbyhNtg6t_dvtyZnro_pQhf7RuusB81vMJk5vT6WxP0IYEeef5gi3AOKFzO4zF15PEdb5pbdz9Jw9Md8uu&lib=M4zWjbcaVN7pqnKsV-vY-cRK3RNb248HK"; // Reemplaza con tu enlace
    let { codigo } = req.params;
    const response = await axios.get(scriptUrl);
    const data = (response.data).data;
    const participant = data.find(item => item.IdColumn === parseInt(codigo));

    if (participant) {
      res.json(participant);
    } else {
      res.status(404).json({ error: `Participant with ID ${codigo} not found` });
    }
  } catch (error) {
    console.error("Error fetching data from Google Apps Script:", error);
    res.status(500).json({ error: "Failed to fetch participant data" });
  }
});

router.post("/update", async (req, res) => {
  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ message: "El código es obligatorio" });
  }

  const scriptUrl = "https://script.google.com/macros/s/AKfycbxpYV2_5Y_Mn3hN_iwSMMTsLSLjv_J2cMlBB7zk8RDMlz2yw11vDledN2JmKSPF7h6MiQ/exec"

  try {
    const response = await axios.post(scriptUrl, { codigo });
    res.status(200).json({ message: response.data.message });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ message: "Hubo un error al actualizar el estado" });
  }
});

router.post("/generateQR", async (req, res) => {
  const data = req.body;
  
  const result = await generateQRAndSendEmail(data);
  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;