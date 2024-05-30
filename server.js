const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let sensorData = {
  temperature: null,
  pressure: null,
  altitude: null,
  image: null
};

app.post('/upload', async (req, res) => {
  const { temperature, pressure, altitude, image } = req.body;

  if (!temperature || !pressure || !altitude || !image) {
    return res.status(400).send('Missing required fields');
  }

  sensorData = {
    temperature: parseFloat(temperature),
    pressure: parseFloat(pressure),
    altitude: parseFloat(altitude),
    image: image
  };


  const scriptUrl = 'https://script.google.com/macros/s/AKfycbwwavVO-hQcPxqC62IRD1dsB6K9ZqYCKM8oeNvvr6TVZ5tzjdb7K7LfF9v6WGpGskRrFA/exec';
  try {
    const response = await axios.post(scriptUrl, null, {
      params: {
        data: sensorData.image,
        mimetype: 'image/jpeg', // Substitua pelo tipo MIME correto, se necessário
      },
    });

    console.log('Resposta do Google Apps Script:', response.data);
  } catch (error) {
    console.error('Erro ao enviar a imagem:', error);
  }

  res.status(200).send('Data received successfully');
});

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
        <img src="data:image/jpeg;base64,${sensorData.image}" alt="Captured Image" style="width: 500px; height: 400px;"/>
      </body>
    </html>
  `;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});