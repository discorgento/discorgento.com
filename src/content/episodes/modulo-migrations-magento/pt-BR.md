---
description: "Como o módulo discorgento/module-migrations simplifica data patches no Magento 2 para versionar configurações do admin e páginas CMS via código."
keyPoints:
  - "O discorgento/module-migrations é um simplificador dos data patches nativos do Magento 2, usados para levar ao código alterações feitas no admin ou no banco."
  - "Em vez de implementar os quatro métodos obrigatórios das interfaces de um data patch nativo, basta estender a classe Migration do módulo e implementar um único método obrigatório."
  - "O módulo traz facades, inspiradas no conceito do Laravel, para as alterações mais comuns, como gravar configurações e criar ou atualizar páginas CMS."
  - "Cada migration roda uma única vez no setup:upgrade e fica registrada na tabela patch_list; apagar o registro faz ela rodar de novo no próximo upgrade."
  - "A recomendação do vídeo é manter as migrations atômicas, uma alteração por arquivo, porque elas rodam em ordem alfabética em bancos desatualizados."
faq:
  - question: "O que é o módulo discorgento/module-migrations?"
    answer: "É um módulo open source do discorgento que simplifica os data patches do Magento 2, a forma nativa de escrever migrações de banco. Segundo o vídeo, ele permite versionar no código alterações feitas no admin, como configurações e conteúdo CMS, para que sejam aplicadas automaticamente em outros ambientes e nas máquinas dos colegas."
  - question: "Como criar uma migration com o módulo Migrations no Magento 2?"
    answer: "O arquivo é criado em Setup/Patch/Data do módulo, como um data patch comum, mas estende a classe Migration do discorgento e implementa só o método obrigatório. Dentro dele, as facades fazem o trabalho: no exemplo do vídeo, o método de configuração recebe o path e o valor para trocar a moeda da loja para real brasileiro, aceitando também escopo e loja."
  - question: "Uma migration do Magento roda mais de uma vez?"
    answer: "Não. Segundo o vídeo, a execução fica registrada na tabela patch_list, e rodar o setup:upgrade de novo não executa a mesma migration. Durante o desenvolvimento, para executá-la novamente basta apagar o registro dela nessa tabela."
  - question: "Como manter uma página CMS atualizada com migrations?"
    answer: "O vídeo mostra a criação de uma página CMS a partir do identificador, título, cabeçalho e conteúdo, e a atualização do conteúdo da home em outra migration. Para mudar o conteúdo depois, a orientação é criar uma nova migration, como uma V2, em vez de editar a antiga, já que elas rodam em ordem alfabética."
  - question: "Posso apagar dados direto no banco do Magento?"
    answer: "O vídeo desaconselha: apagar algo direto no banco sempre pode deixar efeitos colaterais e dados residuais, enquanto apagar pelo admin remove tudo o que é relacionado. No exemplo, a página removida à mão no banco deixou resíduos que o admin teria limpado."
---
Neste vídeo curto, o discorgento anuncia oficialmente o **discorgento/module-migrations**, módulo que já vinha sendo usado em produção e é apresentado como estável. A ideia de migration, como explicado, é rastrear alterações de banco via código: no Magento, uma mudança feita no admin fica restrita ao banco local e não chega aos outros ambientes nem aos colegas, que teriam de refazê-la à mão ou importar um banco atualizado.

O Magento 2 já resolve isso com data patches, mas o esqueleto nativo exige quatro métodos obrigatórios das interfaces. O módulo reduz isso a estender a classe Migration e implementar um único método, usando **facades** para as tarefas mais comuns, num conceito que o vídeo compara ao do Laravel. O primeiro exemplo troca a moeda da loja para real brasileiro com o método de configuração, que recebe o path e o valor e aceita escopo e loja. A migration roda no setup:upgrade, fica registrada na tabela patch_list e não executa duas vezes.

O segundo exemplo cria uma página CMS de demonstração e a insere na home, separando a criação da página e a atualização da home em migrations diferentes. A regra de ouro do vídeo é manter cada migration atômica, já que elas rodam em ordem alfabética, e criar uma nova versão para mudar conteúdo depois. O vídeo também alerta para não apagar dados direto no banco e lembra que a wiki do módulo documenta outros facades, como os de gerenciamento de atributos.
