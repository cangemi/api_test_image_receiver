const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do multer para armazenar a imagem em memória e aumentar o limite de tamanho do arquivo
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 50 MB, ajuste conforme necessário
});

// Middleware para processar JSON
app.use(express.json());

// Endpoint POST para receber o buffer da imagem e outros dados
app.post('/upload', upload.none(), (req, res) => {
    if (!req.body) {
        return res.status(400).send('Nenhuma imagem enviada.');
    }

    const imageData = Buffer.from(req.body, 'binary');

    // Salva a imagem como buffer em um arquivo
    const imagePath = path.join(__dirname, 'image.jpg');

    // Se for a primeira parte da imagem, escreve o buffer diretamente, caso contrário, acrescenta ao arquivo existente
    const writeMode = req.query.start ? 'write' : 'append';
    fs[writeMode + 'File'](imagePath, imageData, { flag: 'a' }, (err) => {
        if (err) {
            return res.status(500).send('Erro ao salvar a imagem.');
        }

        res.status(200).send('Parte da imagem recebida e salva com sucesso.');
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