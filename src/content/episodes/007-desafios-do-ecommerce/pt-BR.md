---
description: "Thiago Marquesini fala dos desafios do e-commerce com Magento: escalabilidade, LGPD, SEO, código legado e a troca de frameworks PHP pelo Magento 2."
keyPoints:
  - "Entre 2015 e 2016, Thiago desaconselhou Magento 2 para uma indústria de produtos de prótese dentária com orçamento limitado e sem equipe de TI, e o projeto foi para a Loja Integrada."
  - "Para Ivan Augusto, o maior desafio técnico do e-commerce é a escalabilidade, como evitar queries N+1 ao carregar o model de cada produto num loop de catálogo."
  - "Thiago aplica o princípio de Pareto às demandas: podar parte das regras de negócio pedidas costuma manter o valor e reduzir muito o esforço."
  - "Thiago achou o XML do Magento burocrático no início, mas elogia os plugins (before, after e around) por permitirem alterar classes sem mexer no código de terceiros, e diz que o Knockout é difícil de depurar."
  - "Num projeto de uma instituição nacional com uma loja por estado, o Magento concentrava cerca de 78 integrações."
  - "Thiago recomenda conhecer as limitações da linguagem, como números muito grandes no PHP e 0.1 + 0.2 em JavaScript, e cita o HackerRank como ferramenta que o ajudou nisso."
faq:
  - question: "Qual é o maior desafio de um e-commerce em Magento?"
    answer: "Para Ivan Augusto, é a escalabilidade: sem algumas regras básicas o código vira macarrão, como no caso de queries N+1 ao carregar produtos um a um. Thiago Marquesini acrescenta que o volume de produção é muito maior que o dos testes locais, então nem sempre dá para usar models e é preciso olhar performance, memória e padrões de projeto."
  - question: "Vale a pena usar Magento ou um framework PHP como Laravel para e-commerce?"
    answer: "Segundo Thiago Marquesini, o Magento é totalmente focado em e-commerce e já vem com estrutura para estender funcionalidades e escalar, por exemplo rodando com Varnish e Elasticsearch. Num framework como Laravel, cache, escala e arquitetura precisam ser implementados à mão. Em contrapartida, ele aponta que a mão de obra Magento é mais difícil de encontrar e mais cara, o que pesa no custo total de propriedade."
  - question: "Dá para fazer upgrade do Magento 1 para o Magento 2?"
    answer: "No episódio, os hosts explicam que não existe um upgrade direto do Magento 1 para o 2: é preciso instalar uma loja nova e importar os dados. Muitos conceitos do Magento 1, como eventos e atributos, são aproveitados, mas praticamente só o banco de dados é reaproveitado."
  - question: "Como a LGPD afeta projetos de e-commerce no Brasil?"
    answer: "Thiago Marquesini conta que nos projetos de que participa a LGPD ainda é tratada sem muita preocupação, porque a lei teve um prazo longo de adaptação. Ele acredita que em um ou dois anos isso vai virar uma preocupação muito presente e começar a doer na operação das lojas, como já acontece na Europa."
  - question: "Como Thiago Marquesini lida com a ansiedade trabalhando com tecnologia?"
    answer: "Ele conta que a terapia o ajudou a controlar a ansiedade, que é transparente com o time e o Scrum Master sobre o que consegue entregar e que tenta manter horário para começar e terminar o trabalho. Também diz que esportes como o jiu-jitsu o ajudam a manter a calma em situações desconfortáveis."
---
Neste sétimo episódio, Jonatan Machado, Maria Ferro e Ivan Augusto recebem Thiago Marquesini, que trabalha como desenvolvedor e tem alguns anos na área de TI, mais recentemente no mundo Magento. Ele conta que teve o primeiro contato com a plataforma entre 2015 e 2016, quando desaconselhou o Magento 2, recém-lançado, para uma indústria de prótese dentária e acabou personalizando uma loja na Loja Integrada com JavaScript no rodapé. O contato mais profundo veio numa empresa em transformação digital, onde acompanhou a agência parceira e montou uma equipe interna de desenvolvimento.

Sobre os **desafios do e-commerce**, Ivan aponta a escalabilidade, e Thiago fala em equilibrar o desejo do negócio com o esforço, usando o princípio de Pareto e o MVP. A conversa passa por segurança de dados e LGPD, acessibilidade (incluindo um cliente canadense multado e um índice de acessibilidade exigido pelo governo brasileiro) e SEO, com a menção a uma palestra do Meet Magento sobre avaliações de usuários no ranqueamento.

Thiago compara o Magento com CodeIgniter, Laravel, Symfony, Slim e Phalcon: elogia os plugins e a organização, critica a dificuldade de depurar Knockout e defende o perfil mais conservador da plataforma, citando o custo total de propriedade. Ele também relembra um projeto com cerca de 78 integrações, um checkout com cálculo de substituição tributária escrito em dois phtml de umas mil linhas cada, um sistema de provas online usado por 900 alunos ao mesmo tempo e uma biblioteca em PHP que analisava fotos de pasto pela média de RGB. No fim, fala de ansiedade, terapia, jiu-jitsu e do conselho que daria a si mesmo: **arriscar mais**.
