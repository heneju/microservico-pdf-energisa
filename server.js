const express = require('express');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Microserviço PDF Energisa funcionando!',
    status: 'online'
  });
});

app.post('/preencher-energisa', async (req, res) => {
  try {
    console.log('Recebendo dados:', req.body);

    let { 
      tipoOperacao,
      unidadeConsumidora,
      titular,
      beneficiarios = [],
      dataAssinatura 
    } = req.body;

    if (typeof titular === 'string') {
      titular = JSON.parse(titular);
    }
    if (typeof beneficiarios === 'string') {
      beneficiarios = JSON.parse(beneficiarios);
    }
    if (typeof dataAssinatura === 'string') {
      dataAssinatura = JSON.parse(dataAssinatura);
    }

    if (!titular || !titular.nome) {
      return res.status(400).json({ error: 'Titular é obrigatório' });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText(`FORMULÁRIO ENERGISA - ${tipoOperacao?.toUpperCase() || 'CADASTRO'}`, {
      x: 50,
      y: 750,
      size: 16
    });

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

    page.drawText(`CPF: ${titular.cpf || 'N/A'} | CNPJ: ${titular.cnpj || 'N/A'}`, {
      x: 50,
      y: 660,
      size: 12
    });

    let yPosition = 620;
    beneficiarios.forEach((ben, index) => {
      page.drawText(`${index + 1}. ${ben.nomeDoTitular || 'N/A'} - ${ben.percentual || '0'}%`, {
        x: 50,
        y: yPosition,
        size: 10
      });
      yPosition -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    
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