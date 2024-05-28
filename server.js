const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do multer para armazenar a imagem em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware para processar JSON
app.use(express.json());

// Endpoint POST para receber o buffer da imagem e outros dados
app.post('/upload', upload.single('image'), (req, res) => {
    const { temperature, pressure, altitude } = req.body;

    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    // Salva a imagem como buffer em um arquivo
    const imagePath = path.join(__dirname, 'image.jpg');
    fs.writeFile(imagePath, req.file.buffer, (err) => {
        if (err) {
            return res.status(500).send('Erro ao salvar a imagem.');
        }

        // Log de outros dados recebidos
        console.log(`Temperatura: ${temperature}`);
        console.log(`Pressão: ${pressure}`);
        console.log(`Altitude: ${altitude}`);

        res.status(200).send('Imagem e dados recebidos e salvos com sucesso.');
    });
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