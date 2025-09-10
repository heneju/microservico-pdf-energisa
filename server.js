const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

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

    console.log('Procurando template em:', templatePath);
    
    try {
      console.log('Arquivos na pasta templates:', fs.readdirSync('./templates/'));
    } catch (e) {
      console.log('Erro ao listar pasta templates:', e.message);
    }

    if (!fs.existsSync(templatePath)) {
      console.log('Template não encontrado. Listando arquivos:');
      try {
        const files = fs.readdirSync('./templates/');
        console.log('Arquivos encontrados:', files);
      } catch (e) {
        console.log('Pasta templates não existe:', e.message);
      }
      return res.status(500).json({ error: 'Template PDF não encontrado' });
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('Campos encontrados no PDF:', fields.map(field => field.getName()));

    try {
      if (tipoOperacao === 'cadastro') {
        form.getCheckBox('cadastro').check();
      } else if (tipoOperacao === 'descadastramento') {
        form.getCheckBox('descadastramento').check();
      } else if (tipoOperacao === 'alteracao') {
        form.getCheckBox('alteracao').check();
      }
    } catch (e) {
      console.log('Checkboxes de tipo não encontrados:', e.message);
    }

    try {
      form.getTextField('unidadeConsumidora').setText(unidadeConsumidora || '');
    } catch (e) {
      console.log('Campo unidadeConsumidora não encontrado:', e.message);
    }

    try {
      form.getTextField('titularNome').setText(titular.nome || '');
    } catch (e) {
      console.log('Campo titularNome não encontrado:', e.message);
    }

    try {
      form.getTextField('titularCPF').setText(titular.cpf || '');
    } catch (e) {
      console.log('Campo titularCPF não encontrado:', e.message);
    }

    try {
      form.getTextField('titularCNPJ').setText(titular.cnpj || '');
    } catch (e) {
      console.log('Campo titularCNPJ não encontrado:', e.message);
    }

    try {
      form.getTextField('telefoneResidencial').setText(titular.telefoneResidencial || '');
    } catch (e) {
      console.log('Campo telefoneResidencial não encontrado:', e.message);
    }

    try {
      form.getTextField('telefoneComercial').setText(titular.telefoneComercial || '');
    } catch (e) {
      console.log('Campo telefoneComercial não encontrado:', e.message);
    }

    beneficiarios.forEach((ben, index) => {
      try {
        form.getTextField(`beneficiario${index + 1}UC`).setText(ben.unidadeConsumidora || '');
        form.getTextField(`beneficiario${index + 1}Nome`).setText(ben.nomeDoTitular || '');
        form.getTextField(`beneficiario${index + 1}CPF`).setText(ben.cpfCnpj || '');
        form.getTextField(`beneficiario${index + 1}Endereco`).setText(ben.endereco || '');
        form.getTextField(`beneficiario${index + 1}Percentual`).setText(ben.percentual || '');
      } catch (e) {
        console.log(`Campos do beneficiário ${index + 1} não encontrados:`, e.message);
      }
    });

    if (dataAssinatura) {
      try {
        form.getTextField('cidade').setText(dataAssinatura.cidade || '');
        form.getTextField('dia').setText(dataAssinatura.dia || '');
        form.getTextField('mes').setText(dataAssinatura.mes || '');
        form.getTextField('ano').setText(dataAssinatura.ano || '');
      } catch (e) {
        console.log('Campos de data não encontrados:', e.message);
      }
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
