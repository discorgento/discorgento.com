---
description: "VTEX ou Magento? Felipe Mendes e Vitor Couto comparam customização, checkout, Page Builder e Site Editor e contam como foi migrar do Magento para a VTEX."
keyPoints:
  - "Para Vitor Couto, a VTEX tem uma curva de aprendizado menor que o Magento porque o front-end é todo em React, enquanto o Magento usa Knockout."
  - "Felipe Mendes resume a diferença assim: o Magento é 100% customizável, enquanto a VTEX é SaaS e deixa back-end e servidor sob responsabilidade dela, sem acesso ao código-fonte."
  - "No Page Builder do Magento dá para arrastar blocos e montar a página; na VTEX, o cliente só edita no Site Editor os blocos de páginas cujo template já tem um JSON Schema configurado."
  - "Na VTEX não existe ambiente de desenvolvimento local: tudo roda na nuvem da plataforma e, sem internet, não dá para trabalhar."
  - "Segundo Felipe Mendes, checkout e área do usuário são as partes mais fechadas da VTEX, e customizar o checkout transfere parte da responsabilidade por problemas para quem customizou."
  - "Vitor Couto conta que o checkout da VTEX também é feito em Knockout e que levou cerca de três a quatro meses para se sentir à vontade sobrescrevendo componentes nativos da plataforma."
faq:
  - question: "VTEX é melhor que Magento?"
    answer: "Segundo Vitor Couto e Felipe Mendes, depende. Vitor diz que a VTEX é mais fácil para quem está começando, por usar React. Felipe afirma que a escolha depende dos processos do cliente: empresas com muitas regras e customizações tendem a se encaixar melhor no Magento, que é 100% customizável, enquanto a VTEX é um SaaS com partes fechadas."
  - question: "O que estudar para migrar de Magento para VTEX?"
    answer: "Vitor Couto recomenda principalmente React, incluindo gerenciamento de estado, e TypeScript, já que a própria VTEX escreve seus apps nele. Ele também cita Sass, que é fácil de integrar e parecido com o Less do Magento, e JSON Schema, que liga as propriedades dos componentes ao que o cliente edita no Site Editor."
  - question: "Dá para customizar o checkout da VTEX?"
    answer: "Dá, mas com limitações. Vitor Couto explica que o checkout da VTEX é feito em Knockout, sem acesso a essa camada, e que customizações maiores são feitas com JavaScript e CSS pelo editor do checkout no painel. Felipe Mendes diz que checkout e área do usuário são as áreas mais fechadas da plataforma e que customizá-las pode gerar problemas a cada atualização."
  - question: "O que acontece quando um projeto VTEX foge do padrão recomendado?"
    answer: "Segundo Felipe Mendes, vira bug atrás de bug: resolve-se um problema e outro aparece. Vitor Couto cita um projeto que movia elementos na tela com JavaScript puro em vez de sobrescrever componentes React. Nesse caso, a equipe recorreu ao VTEX Pro, serviço pago com sessões com um arquiteto da VTEX e um contato dedicado para dúvidas."
  - question: "O que é preciso para começar a trabalhar como Product Owner em e-commerce?"
    answer: "Para Felipe Mendes, o PO precisa se tornar dono do negócio: entender os processos e objetivos do cliente, como os OKRs de três meses, e transformá-los em tarefas táticas. Ele também recomenda conhecer a estrutura da plataforma para explicar aos stakeholders o que é possível e estimar melhor e pior cenário."
---
No terceiro episódio, Jonatan Machado e Maria Ferro conversam com Felipe Mendes e Vitor Couto, que trabalham juntos numa agência de e-commerce. Vitor tem cerca de um ano implementando lojas VTEX e antes trabalhava com Magento; Felipe é Product Owner, formado em engenharia de produção, e começou na agência como suporte de lojas Magento 2.

Sobre **VTEX vs Magento**, a resposta dos dois é "depende". Vitor destaca o front-end em React, a estrutura de páginas montada em JSON, os apps de back-end em Node e a falta de um ambiente local, já que tudo roda na nuvem da VTEX; ele aposta no FastStore para mudar isso. Felipe compara o SaaS da VTEX com a liberdade total do Magento, o Page Builder com o Site Editor, e explica por que barra muitas customizações de checkout e área do usuário. Maria Ferro estranha o cadastro de produtos e SKUs no painel, feito página por página. Também aparecem a barra de frete grátis, pedido comum que dá trabalho na VTEX, o exemplo de um fluxograma enorme da Avon apresentado num evento da VTEX e o serviço pago VTEX Pro.

A segunda parte fala de carreira e saúde mental. Vitor começou como estagiário na versão antiga da VTEX, passou pelo Magento numa empresa de turismo e hoje quer trabalhar com produto. Felipe conta como a empresa adotou o ágil, o "roteiro de desenvolvimento" que deixou as estimativas mais assertivas e o escritório virtual no Gather. Sobre ansiedade, Vitor caminha e corre com o cachorro, e Felipe voltou a cansar o corpo com natação, luta, skate e corrida depois de uma crise. Nos conselhos ao eu do passado: **ir com calma**, não querer abraçar o mundo e não ter medo de errar.
