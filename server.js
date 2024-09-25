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
// Middleware para processar dados binários
app.use(bodyParser.raw({ type: 'application/octet-stream' }));

let sensorData = {
  temperature: null,
  pressure: null,
  altitude: null,
  macAddress: null,
  image: null
};


let imageChunks = {};  // Armazenar temporariamente os chunks de cada dispositivo

let totalChunks = 0; // Variável para rastrear o número total de chunks
let currentChunkIndex = 0; // Índice do chunk atual

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


app.post('/image', (req, res) => {
  // Obtenha os dados binários do corpo da requisição
  const imageChunk = req.body;

  // Os headers devem incluir informações como 'chunk_index' e 'total_chunks'
  const chunkIndex = parseInt(req.headers['chunk_index'], 10);
  const totalChunks = parseInt(req.headers['total_chunks'], 10);

  // Verifique se o chunk recebido é válido
  if (chunkIndex === 0) {
    // Reinicie o controle de chunks para um novo upload
    currentChunkIndex = 0;
    totalChunks = 0;
  }

  // Armazenar ou processar o chunk da imagem
  console.log(`Received chunk ${chunkIndex + 1} of ${totalChunks}`);
  
  // Aqui você pode armazenar cada chunk em um buffer ou arquivo
  // Você pode optar por concatenar todos os chunks em um buffer
  // ou armazenar cada chunk como um arquivo separado.

  // Exemplo de armazenamento em um buffer (opcional)
  if (chunkIndex === 0) {
    // Inicialize o buffer para armazenar a imagem completa
    buffer = Buffer.alloc(totalChunks * chunkSize);
  }

  // Adiciona o chunk ao buffer
  imageChunk.copy(buffer, chunkIndex * chunkSize);

  currentChunkIndex++;

  // Verifique se todos os chunks foram recebidos
  if (currentChunkIndex === totalChunks) {
    console.log('Received all chunks.');

    sensorData.image = buffer;

    // Aqui você pode processar a imagem completa
    // Exemplo: salvar em um arquivo
    const fs = require('fs');
    fs.writeFile('uploaded_image.jpg', buffer, (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).send('Error saving image');
      }
      console.log('Image saved successfully.');
      res.status(200).send('Image received successfully');
    });
  } else {
    // Enviar resposta de sucesso para o chunk recebido
    res.status(200).send(`Chunk ${chunkIndex + 1} received successfully.`);
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
  if (!sensorData.image) {
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