const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 5 * 1024 * 1024 }  // Limite de 5MB, ajuste conforme necessário
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let sensorData = {
  temperature: null,
  pressure: null,
  altitude: null,
  macAddress: null,
  image: null
};


app.post('/upload', upload.single('image'), (req, res) => {
  const { temperature, pressure, altitude,device_mac } = req.body;
  console.log('Chunk received: ', req.file);
  const image = req.file; // O arquivo enviado

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  sensorData = {
    temperature: parseFloat(temperature),
    pressure: parseFloat(pressure),
    altitude: parseFloat(altitude),
    macAddress: device_mac,
    image: image.buffer // Aqui você pode salvar a imagem ou fazer o que precisar
  };

  // Exemplo de como você pode processar a imagem, se necessário
  // const imageBuffer = image.buffer; // Buffer da imagem, se você quiser armazenar ou manipular

  res.status(200).send('Data received successfully');
});

app.post('/', (req, res) => {
  const { temperature, pressure, altitude, image } = req.body;

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  sensorData = {
    temperature: parseFloat(temperature),
    pressure: parseFloat(pressure),
    altitude: parseFloat(altitude),
    macAddress: device_mac,
    image: image.buffer // Aqui você pode salvar a imagem ou fazer o que precisar
  };


  res.status(200).send('Data received successfully');
});

app.get('/', (req, res) => {
  if (!sensorData.temperature) {
    return res.status(404).send('No data available');
  }
  const imageBase64 = sensorData.image.toString('base64');
  const html = `
    <html>
      <body>
        <h1>Sensor Data</h1>
        <p>Temperature: ${sensorData.temperature} °C</p>
        <p>Pressure: ${sensorData.pressure} PA</p>
        <p>Altitude: ${sensorData.altitude} Metros</p>
        <p>MAC: ${sensorData.macAddress}</p>
        <img src="data:image/jpeg;base64,${imageBase64}" alt="Captured Image" style="width: 600px; height: 400px;"/>
      </body>
    </html>
  `;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});