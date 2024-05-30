const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o body-parser para lidar com solicitações JSON
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configurar o multer para lidar com uploads de arquivos
const upload = multer({ dest: 'uploads/' });

let sensorData = {
  temperature: null,
  pressure: null,
  altitude: null,
  image: null
};

// Rota para lidar com o envio de dados do sensor e imagem
app.post('/upload', upload.single('image'), (req, res) => {
  const { temperature, pressure, altitude } = req.body;
  const image = req.file; // A imagem é salva como um arquivo temporário pelo multer

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  // Ler o arquivo temporário da imagem e armazenar seus dados no sensorData
  fs.readFile(image.path, (err, data) => {
    if (err) {
      return res.status(500).send('Error reading image file');
    }

    sensorData = {
      temperature: parseFloat(temperature),
      pressure: parseFloat(pressure),
      altitude: parseFloat(altitude),
      image: data // Salvar os dados da imagem
    };

    res.status(200).send('Data received successfully');
  });
});

// Rota para exibir os dados do sensor e a imagem
app.get('/', (req, res) => {
  if (!sensorData.temperature) {
    return res.status(404).send('No data available');
  }

  const html = `
    <html>
      <body>
        <h1>Sensor Data</h1>
        <p>Temperature: ${sensorData.temperature} °C</p>
        <p>Pressure: ${sensorData.pressure} hPa</p>
        <p>Altitude: ${sensorData.altitude} m</p>
        <img src="data:image/jpeg;base64,${sensorData.image.toString('base64')}" alt="Captured Image"/>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
