const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let sensorData = {
  temperature: null,
  pressure: null,
  altitude: null,
  mac:null,
  image: null
};


// Configuração do multer para salvar arquivos em disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Nome original do arquivo
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  const { temperature, pressure, altitude } = req.body;
  const imagePath = req.file.path;

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  sensorData = {
    temperature: parseFloat(temperature),
    pressure: parseFloat(pressure),
    altitude: parseFloat(altitude),
    mac: mac,
    image: imagePath // Aqui você pode salvar a imagem ou fazer o que precisar
  };

  // Exemplo de como você pode processar a imagem, se necessário
  // const imageBuffer = image.buffer; // Buffer da imagem, se você quiser armazenar ou manipular

  res.status(200).send('Data received successfully');
});

 /*app.post('/', (req, res) => {
  const { temperature, pressure, altitude, mac, image } = req.body;

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  sensorData = {
    temperature: parseFloat(temperature),
    pressure: parseFloat(pressure),
    altitude: parseFloat(altitude),
    mac: mac,
    image: image
  };

  res.status(200).send('Data received successfully');
});*/

app.get('/', (req, res) => {
  if (!sensorData.temperature) {
    return res.status(404).send('No data available');
  }

  const html = `
    <html>
      <body>
        <h1>Sensor Data</h1>
        <p>Temperature: ${sensorData.temperature} °C</p>
        <p>Pressure: ${sensorData.pressure} PA</p>
        <p>Altitude: ${sensorData.altitude} Metros</p>
        <p>Mac do dispositivo: ${sensorData.mac}</p>
        <img src="${sensorData.image}" alt="Captured Image" style="width: 600px; height: 400px;"/>
      </body>
    </html>
  `;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});