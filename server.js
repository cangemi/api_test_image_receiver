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


let imageChunks = {};  // Armazenar temporariamente os chunks de cada dispositivo

app.post('/upload', (req, res) => {
  const { temperature, pressure, altitude, device_mac, chunk_index, total_chunks, image_chunk } = req.body;

  // Verificar se todos os campos obrigatórios foram enviados
  if (!temperature || !pressure || !altitude || !device_mac || !image_chunk || !chunk_index || !total_chunks) {
    return res.status(400).send('Missing required fields');
  }

  // Inicializa um array para o dispositivo se não existir
  if (!imageChunks[device_mac]) {
    imageChunks[device_mac] = [];
  }

  // Armazenar o chunk no array
  imageChunks[device_mac][chunk_index] = image_chunk;

  console.log(`Received chunk ${chunk_index + 1} of ${total_chunks} from device ${device_mac}`);

  // Se todos os chunks foram recebidos, reconstrua a imagem
  if (parseInt(chunk_index) + 1 == total_chunks) {
    // Concatena todos os chunks
    const fullImageBase64 = imageChunks[device_mac].join('');
    
    // Decodificar Base64 de volta para binário
    const imageBuffer = Buffer.from(fullImageBase64, 'base64');

    // Agora você pode salvar a imagem ou processá-la
    console.log(`Image reconstruction completed for device ${device_mac}, total size: ${imageBuffer.length} bytes`);

    // Limpar a variável temporária
    delete imageChunks[device_mac];

    // Armazenar outros dados recebidos
    sensorData = {
      temperature: parseFloat(temperature),
      pressure: parseFloat(pressure),
      altitude: parseFloat(altitude),
      macAddress: device_mac,
      image: imageBuffer  // Armazenando o buffer da imagem
    };

    res.status(200).send('Image received and reconstructed successfully');
  } else {
    // Resposta intermediária enquanto ainda há chunks para serem recebidos
    res.status(200).send('Chunk received successfully');
  }
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