const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware para processar JSON
app.use(express.json());

// Usar o body-parser para lidar com requisições JSON
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));

let imageBuffer = Buffer.alloc(0);
let metadata = null;

// Endpoint POST para receber o buffer da imagem e outros dados
app.post('/upload', (req, res) => {
    const contentRange = req.headers['content-range'];
    if (contentRange) {
        const [range, total] = contentRange.split('/');
        const [start, end] = range.split('-').map(Number);

        const chunk = req.body;

        if (start === 0) {
            // Resetar o buffer e extrair os metadados do primeiro bloco
            imageBuffer = Buffer.alloc(0);

            // Supondo que os primeiros bytes do chunk sejam os metadados JSON
            const metadataEndIndex = chunk.indexOf('}') + 1;
            const metadataStr = chunk.slice(0, metadataEndIndex).toString();
            metadata = JSON.parse(metadataStr);

            // Extrair a parte da imagem que está no primeiro bloco
            imageBuffer = Buffer.concat([imageBuffer, chunk.slice(metadataEndIndex)]);
        } else {
            // Concatena o resto da imagem
            imageBuffer = Buffer.concat([imageBuffer, chunk]);
        }

        if (end + 1 === Number(total)) {
            // Se for o último bloco, salve a imagem
            const imagePath = path.join(__dirname, 'image.jpg');
            fs.writeFile(imagePath, imageBuffer, (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return res.status(500).send('Erro ao salvar a imagem.');
                }
                console.log('File saved successfully');
                console.log(`Temperatura: ${metadata.temperature}`);
                console.log(`Pressão: ${metadata.pressure}`);
                console.log(`Altitude: ${metadata.altitude}`);
                return res.status(200).send('Imagem e dados recebidos e salvos com sucesso.');
            });
        } else {
            return res.status(200).send('Chunk received');
        }
    } else {
        return res.status(400).send('Invalid request');
    }
});

// Endpoint GET para retornar um HTML que mostra a imagem
app.get('/image', (req, res) => {
    const imagePath = path.join(__dirname, 'image.jpg');
    fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('Imagem não encontrada.');
        }

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imagem</title>
            </head>
            <body>
                <h1>Imagem carregada</h1>
                <img src="/image-file" alt="Imagem carregada" />
            </body>
            </html>
        `);
    });
});

// Endpoint para servir a imagem diretamente
app.get('/image-file', (req, res) => {
    const imagePath = path.join(__dirname, 'image.jpg');
    res.sendFile(imagePath);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
