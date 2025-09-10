const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

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

    const templatePath = './templates/FORMULARIO_ENERGISA_PLACEFIELDS.pdf';
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Verificar se o PDF tem formulário
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      console.log('=== ANÁLISE DO PDF ===');
      console.log('Número de campos encontrados:', fields.length);
      
      if (fields.length > 0) {
        console.log('Campos disponíveis:');
        fields.forEach((field, index) => {
          console.log(`${index + 1}. ${field.getName()} (${field.constructor.name})`);
        });
        
        // Tentar preencher campos genéricos
        fields.forEach(field => {
          const fieldName = field.getName().toLowerCase();
          console.log('Tentando preencher campo:', fieldName);
          
          try {
            if (fieldName.includes('cadastro') && tipoOperacao === 'cadastro') {
              field.check();
            } else if (fieldName.includes('titular') || fieldName.includes('nome')) {
              field.setText(titular.nome);
            } else if (fieldName.includes('cpf')) {
              field.setText(titular.cpf || '');
            } else if (fieldName.includes('unidade')) {
              field.setText(unidadeConsumidora || '');
            }
          } catch (e) {
            console.log(`Erro ao preencher ${fieldName}:`, e.message);
          }
        });
        
      } else {
        console.log('PDF não possui campos de formulário - criando overlay de texto');
        
        // Se não tem campos, adicionar texto por cima
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // Adicionar texto nas posições aproximadas
        firstPage.drawText(`UC: ${unidadeConsumidora}`, {
          x: 700, y: 238, size: 10
        });
        
        firstPage.drawText(titular.nome, {
          x: 400, y: 630, size: 10
        });
        
        // Marcar checkbox cadastro (aproximadamente)
        firstPage.drawRectangle({
          x: 395, y: 247,
          width: 8,
          height: 8,
          color: { r: 0, g: 0, b: 0 }
        });
      }
      
    } catch (e) {
      console.log('Erro ao processar formulário:', e.message);
      // PDF pode não ter formulário, tentar adicionar texto diretamente
    }

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
