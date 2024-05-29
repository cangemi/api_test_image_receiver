const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let sensorData = {
  temperature: null,
  pressure: null,
  altitude: null,
  image: null
};

app.post('/upload', upload.single('image'), (req, res) => {
  const { temperature, pressure, altitude } = req.body;
  const image = req.file;

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  sensorData = {
    temperature: parseFloat(temperature),
    pressure: parseFloat(pressure),
    altitude: parseFloat(altitude),
    image: image.buffer.toString('base64')
  };

  res.status(200).send('Data received successfully');
});

app.get('/', (req, res) => {
  if (sensorData.temperature) {
    return res.status(404).send('No data available');
  }

  const html = `
    <html>
      <body>
        <h1>Sensor Data</h1>
        <p>Temperature: ${sensorData.temperature} °C</p>
        <p>Pressure: ${sensorData.pressure} hPa</p>
        <p>Altitude: ${sensorData.altitude} m</p>
        <img src="data:image/jpeg;base64,${sensorData.image}" alt="Captured Image"/>
      </body>
    </html>
  `;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});