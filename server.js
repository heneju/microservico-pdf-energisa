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

    // Converter strings JSON para objetos se necessário
    if (typeof titular === 'string') {
      titular = JSON.parse(titular);
    }
    if (typeof beneficiarios === 'string') {
      beneficiarios = JSON.parse(beneficiarios);
    }
    if (typeof dataAssinatura === 'string') {
      dataAssinatura = JSON.parse(dataAssinatura);
    }

    // Validações básicas
    if (!titular || !titular.nome) {
      return res.status(400).json({ error: 'Titular é obrigatório' });
    }

    // Criar PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    // Adicionar conteúdo ao PDF
    page.drawText(`FORMULÁRIO ENERGISA - ${tipoOperacao.toUpperCase()}`, {
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

    page.drawText(`Tel. Residencial: ${titular.telefoneResidencial || 'N/A'}`, {
      x: 50,
      y: 640,
      size: 12
    });

    page.drawText(`Tel. Comercial: ${titular.telefoneComercial || 'N/A'}`, {
      x: 50,
      y: 620,
      size: 12
    });

    // Adicionar beneficiários
    page.drawText('BENEFICIÁRIOS:', {
      x: 50,
      y: 580,
      size: 14
    });

    let yPosition = 560;
    beneficiarios.forEach((ben, index) => {
      page.drawText(`${index + 1}. ${ben.nomeDoTitular || 'N/A'} - ${ben.percentual || '0'}%`, {
        x: 50,
        y: yPosition,
        size: 10
      });
      page.drawText(`   UC: ${ben.unidadeConsumidora || 'N/A'} | CPF/CNPJ: ${ben.cpfCnpj || 'N/A'}`, {
        x: 50,
        y: yPosition - 15,
        size: 10
      });
      page.drawText(`   Endereço: ${ben.endereco || 'N/A'}`, {
        x: 50,
        y: yPosition - 30,
        size: 10
      });
      yPosition -= 60;
    });

    // Data e assinatura
    if (dataAssinatura) {
      page.drawText(`Local/Data: ${dataAssinatura.cidade || ''}, ${dataAssinatura.dia || ''} de ${dataAssinatura.mes || ''} de ${dataAssinatura.ano || ''}`, {
        x: 50,
        y: 150,
        size: 12
      });
    }

    page.drawText('_________________________________', {
      x: 50,
      y: 100,
      size: 12
    });

    page.drawText('Assinatura do Titular', {
      x: 50,
      y: 80,
      size: 10
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