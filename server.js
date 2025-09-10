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
    
    const form = pdfDoc.getForm();
    
    // Mapeamento inteligente baseado na ordem dos campos
    // Assumindo que os campos seguem a ordem visual do formulário
    
    try {
      // Checkboxes de tipo de operação (posições 32, 33, 34)
      if (tipoOperacao === 'cadastro') {
        form.getCheckBox('checkbox_46zoto').check();
      } else if (tipoOperacao === 'descadastramento') {
        form.getCheckBox('checkbox_47xoyv').check();
      } else if (tipoOperacao === 'alteracao') {
        form.getCheckBox('checkbox_48tjdb').check();
      }
      
      // Unidade consumidora geradora (provavelmente um dos primeiros campos)
      form.getTextField('text_4yrbk').setText(unidadeConsumidora || '');
      
      // Beneficiários - assumindo que há 6 linhas na tabela
      // Cada linha tem: UC, Nome, CPF/CNPJ, Endereço, %
      beneficiarios.forEach((ben, index) => {
        const baseIndex = 5 + (index * 5); // Começando do campo 5, 5 campos por beneficiário
        
        if (baseIndex < 30) { // Garantir que não exceda os campos disponíveis
          try {
            form.getTextField(`text_${baseIndex}kxia`).setText(ben.unidadeConsumidora || '');
            form.getTextField(`text_${baseIndex + 1}sniw`).setText(ben.nomeDoTitular || '');
            form.getTextField(`text_${baseIndex + 2}sko`).setText(ben.cpfCnpj || '');
            form.getTextField(`text_${baseIndex + 3}cxvm`).setText(ben.endereco || '');
            form.getTextField(`text_${baseIndex + 4}hgrb`).setText(ben.percentual + '%' || '');
          } catch (e) {
            console.log(`Erro ao preencher beneficiário ${index + 1}:`, e.message);
          }
        }
      });
      
      // Dados do titular (provavelmente nos últimos campos)
      form.getTextField('text_36kesx').setText(titular.nome || '');
      form.getTextField('text_37iuuk').setText(titular.cpf || '');
      form.getTextField('text_38xwcc').setText(titular.cnpj || '');
      form.getTextField('text_39mptv').setText(titular.telefoneResidencial || '');
      form.getTextField('text_40dykc').setText(titular.telefoneComercial || '');
      
      // Data de assinatura
      if (dataAssinatura) {
        form.getTextField('text_41ojrj').setText(dataAssinatura.cidade || '');
        form.getTextField('text_42pmfj').setText(dataAssinatura.dia || '');
        form.getTextField('text_43lpbc').setText(dataAssinatura.mes || '');
        form.getTextField('text_44crle').setText(dataAssinatura.ano || '');
      }
      
      console.log('Campos preenchidos com sucesso!');
      
    } catch (e) {
      console.log('Erro ao preencher campos:', e.message);
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
