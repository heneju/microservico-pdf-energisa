const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'Microserviço PDF Energisa funcionando!',
    status: 'online'
  });
});

// Rota principal para preencher PDF
app.post('/preencher-energisa', async (req, res) => {
  try {
    console.log('Recebendo dados:', req.body);

    const { 
      unidadeConsumidora,
      beneficiarios = [],
      titular 
    } = req.body;

    // Validações básicas
    if (!titular || !titular.nome) {
      return res.status(400).json({ error: 'Titular é obrigatório' });
    }

    // Aqui você carregaria seu PDF template
    // Por enquanto, vamos criar um PDF simples para teste
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    // Adicionar texto ao PDF (versão simplificada para teste)
    page.drawText(`Unidade Consumidora: ${unidadeConsumidora || 'N/A'}`, {
      x: 50,
      y: 700,
      size: 12
    });

    page.drawText(`Titular: ${titular.nome}`, {
      x: 50,
      y: 680,
      size: 12
    });

    page.drawText(`CPF/CNPJ: ${titular.cpf || 'N/A'}`, {
      x: 50,
      y: 660,
      size: 12
    });

    // Adicionar beneficiários
    let yPosition = 620;
    beneficiarios.forEach((ben, index) => {
      page.drawText(`Beneficiário ${index + 1}: ${ben.nome || 'N/A'} - ${ben.percentual || '0'}%`, {
        x: 50,
        y: yPosition,
        size: 10
      });
      yPosition -= 20;
    });

    // Gerar o PDF
    const pdfBytes = await pdfDoc.save();
    
    // Retornar o PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=energisa-preenchido.pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});