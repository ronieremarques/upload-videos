const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg'); // Importando fluent-ffmpeg
const { v4: uuidv4 } = require('uuid'); // Importando a função para gerar UUID

const app = express();
const PORT = 8080;

// Middleware para servir arquivos estáticos
app.use(express.static('public'));
app.use('/videos', express.static(path.join(__dirname, 'public/videos'))); // Servindo arquivos da pasta videos

// Variável para armazenar o ID do arquivo atual
let currentFileId;

// Configuração do multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/videos/');
    },
    filename: (req, file, cb) => {
        currentFileId = uuidv4(); // Gerando um ID único e armazenando
        cb(null, `data-video-${currentFileId}.mp4`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // Limite de 5 GB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.mp4') {
            return cb(null, true); // Permitir outros formatos para conversão
        }
        cb(null, true);
    }
});

// Rota para upload de vídeo
app.post('/upload', upload.single('video'), async (req, res) => {
    try {
        const outputFilePath = path.join('public/videos/', `data-video-${currentFileId}.mp4`);
        
        // Se o vídeo não for mp4, converta
        if (path.extname(req.file.originalname) !== '.mp4') {
            ffmpeg(req.file.path)
                .toFormat('mp4')
                .on('end', () => {
                    res.status(200).send(`Vídeo enviado e convertido com sucesso! Acesse em: <a href="/videos/data-video-${currentFileId}.mp4" target="_blank">/videos/data-video-${currentFileId}.mp4</a>`);
                })
                .on('error', (error) => {
                    res.status(500).send('Erro ao converter o vídeo: ' + error.message);
                })
                .save(outputFilePath);
        } else {
            res.status(200).send(`Vídeo enviado com sucesso! Acesse em: <a href="/videos/data-video-${currentFileId}.mp4" target="_blank">/videos/data-video-${currentFileId}.mp4</a>`);
        }
    } catch (error) {
        res.status(500).send('Erro ao enviar o vídeo: ' + error.message);
    }
});

// Rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
