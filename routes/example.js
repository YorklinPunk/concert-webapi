const express = require("express");
const axios = require("axios");
const router = express.Router();
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const path = require("path");
// Configuración de transporte de correo
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL_SENDER, // Cambia esto por tu correo
    pass: process.env.PASS_EMAIL_SENDER // Contraseña de aplicación (ver nota abajo)
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
      from: process.env.USER_EMAIL_SENDER, // Correo del remitente
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
  const response = { success: false, data: [], error: null };
  try {
    const scriptUrl = process.env.URL_APP_SCRIPT_GET;    
    const responseUrl = await axios.get(scriptUrl);

    response.success = true;
    response.data = responseUrl.data.data;
    res.json(response);
  } catch (error) {
    response.error = error.message;
    console.error("Error fetching data from Google Apps Script:", error);
    res.status(500).json(response);
  }
});

router.get("/:codigo", async (req, res) => {
  const response = { success: false, data: [], error: null };

  try {
    const scriptUrl = process.env.URL_APP_SCRIPT_GET;    
    let { codigo } = req.params;
    const responseUrl = await axios.get(scriptUrl);
    const data = (responseUrl.data).data;
    const participant = data.find(item => item.IdColumn === parseInt(codigo));

    if (participant) {
      response.success = true;
      response.data = participant;
      res.json(response);
    } else {
      response.error = `Participant with ID ${codigo} not found`;
      res.status(404).json(response);
    }
  } catch (error) {
    response.error = error.message;
    console.error("Error fetching data from Google Apps Script:", error);
    res.status(500).json(response);
  }
});

router.post("/update", async (req, res) => {
  const response = { success: false, message: "", error: null };
  const scriptUrl = process.env.URL_APP_SCRIPT_UPDATE;    
  const { codigo, nombres, apellidos, correo } = req.body;
  console.log(req.body)

  if (!codigo) {
    response.message = "El código es obligatorio";
    return res.status(400).json(response);
  }

  try {
    console.log("scriptUrl", scriptUrl)
    const responseUrl = await axios.post(scriptUrl, { codigo });
    response.message = responseUrl.data.message;    
    response.success = true;

    const mailOptions = {
      from: process.env.USER_EMAIL_SENDER, 
      to: correo,
      subject: "Código QR Utilizado",
      text: `Hola ${nombres} ${apellidos}, gracias por asistir a nuestro evento.`
    };

    console.log(mailOptions)
    transporter.sendMail(mailOptions).catch(mailError => {
      console.error("Error al enviar correo:", mailError.message);
    });

    res.status(200).json(response);
  } catch (error) {
    response.error = error.message;
    console.error("Error al actualizar estado:", error);
    res.status(500).json(response);
  }
});

router.post("/generateQR", async (req, res) => {
  const data = req.body;
  
  const result = await generateQRAndSendEmail(data);
  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;