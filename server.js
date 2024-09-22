const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const Busboy = require('busboy');

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


app.post('/upload', (req, res) => {
  const busboy = new Busboy({ headers: req.headers });

  let imageBuffer = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    file.on('data', (data) => {
      imageBuffer.push(data); // Coletando os chunks
    });

    file.on('end', () => {
      console.log('File upload finished');
    });
  });

  busboy.on('field', (fieldname, val) => {
    if (fieldname === 'temperature') sensorData.temperature = parseFloat(val);
    if (fieldname === 'pressure') sensorData.pressure = parseFloat(val);
    if (fieldname === 'altitude') sensorData.altitude = parseFloat(val);
    if (fieldname === 'device_mac') sensorData.macAddress = val;
  });

  busboy.on('finish', () => {
    sensorData.image = Buffer.concat(imageBuffer); // Concatenando todos os chunks em um único buffer
    res.status(200).send('Data received successfully');
  });

  req.pipe(busboy); // Enviando a requisição para o busboy
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